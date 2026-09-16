import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditActor } from '../audit/audit.service';

import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { ImportBankTransactionsDto } from './dto/import-bank-transactions.dto';
import { QueryBankTransactionsDto } from './dto/query-bank-transactions.dto';
import { ConfirmMatchDto } from './dto/confirm-match.dto';

const MATCH_WINDOW_DAYS = 5;
const AMOUNT_EPSILON = 0.01;

@Injectable()
export class BankReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async addTransaction(dto: CreateBankTransactionDto) {
    await this.assertBankAccountExists(dto.bankAccountId);
    this.assertOneSidedAmount(dto);

    return this.prisma.bankTransaction.create({
      data: {
        bankAccountId: dto.bankAccountId,
        transactionDate: dto.transactionDate,
        description: dto.description,
        referenceNo: dto.referenceNo,
        debitAmount: dto.debitAmount ?? 0,
        creditAmount: dto.creditAmount ?? 0,
        source: 'MANUAL',
      },
    });
  }

  async importTransactions(dto: ImportBankTransactionsDto) {
    await this.assertBankAccountExists(dto.bankAccountId);

    for (const row of dto.rows) {
      this.assertOneSidedAmount(row);
    }

    const result = await this.prisma.bankTransaction.createMany({
      data: dto.rows.map((row) => ({
        bankAccountId: dto.bankAccountId,
        transactionDate: new Date(row.transactionDate),
        description: row.description,
        referenceNo: row.referenceNo,
        debitAmount: row.debitAmount ?? 0,
        creditAmount: row.creditAmount ?? 0,
        source: 'IMPORTED',
      })),
    });

    return { imported: result.count };
  }

  async listTransactions(query: QueryBankTransactionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where = {
      bankAccountId: query.bankAccountId,
      status: query.status || undefined,
    };

    const [total, items] = await Promise.all([
      this.prisma.bankTransaction.count({ where }),
      this.prisma.bankTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async suggestMatches(bankTransactionId: string) {
    const bankTransaction = await this.getBankTransaction(
      bankTransactionId,
    );

    const isReceipt = Number(bankTransaction.creditAmount) > 0;
    const amount = isReceipt
      ? Number(bankTransaction.creditAmount)
      : Number(bankTransaction.debitAmount);

    const windowStart = new Date(
      bankTransaction.transactionDate.getTime() -
        MATCH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const windowEnd = new Date(
      bankTransaction.transactionDate.getTime() +
        MATCH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const alreadyMatchedIds = (
      await this.prisma.bankTransaction.findMany({
        where: { status: 'MATCHED' },
        select: { matchedLedgerEntryId: true },
      })
    )
      .map((row) => row.matchedLedgerEntryId)
      .filter((id): id is string => !!id);

    const candidates = await this.prisma.ledgerEntry.findMany({
      where: {
        bankAccountId: bankTransaction.bankAccountId,
        transactionType: isReceipt ? 'RECEIPT' : 'PAYMENT',
        transactionDate: { gte: windowStart, lte: windowEnd },
        id: { notIn: alreadyMatchedIds },
        ...(isReceipt
          ? { creditAmount: amount }
          : { debitAmount: amount }),
      },
      orderBy: { transactionDate: 'asc' },
      take: 10,
    });

    const partyNames = await this.resolvePartyNames(candidates);

    return candidates
      .map((entry) => ({
        ledgerEntryId: entry.id,
        transactionDate: entry.transactionDate,
        partyType: entry.partyType,
        partyId: entry.partyId,
        partyName:
          partyNames.get(entry.partyId) ?? 'Unknown',
        amount: isReceipt
          ? Number(entry.creditAmount)
          : Number(entry.debitAmount),
        remarks: entry.remarks,
        daysApart: Math.round(
          Math.abs(
            entry.transactionDate.getTime() -
              bankTransaction.transactionDate.getTime(),
          ) /
            (24 * 60 * 60 * 1000),
        ),
      }))
      .sort((a, b) => a.daysApart - b.daysApart);
  }

  async confirmMatch(
    bankTransactionId: string,
    dto: ConfirmMatchDto,
    actor?: AuditActor,
  ) {
    const bankTransaction = await this.getBankTransaction(
      bankTransactionId,
    );

    if (bankTransaction.status !== 'UNMATCHED') {
      throw new BadRequestException(
        `This transaction is ${bankTransaction.status.toLowerCase()} - unmatch it first before matching it to something else.`,
      );
    }

    const ledgerEntry = await this.prisma.ledgerEntry.findUnique(
      { where: { id: dto.ledgerEntryId } },
    );

    if (!ledgerEntry) {
      throw new NotFoundException('Ledger entry not found.');
    }

    if (
      ledgerEntry.bankAccountId !==
      bankTransaction.bankAccountId
    ) {
      throw new BadRequestException(
        'That ledger entry belongs to a different bank account.',
      );
    }

    const isReceipt = Number(bankTransaction.creditAmount) > 0;

    if (
      isReceipt &&
      (ledgerEntry.transactionType !== 'RECEIPT' ||
        Math.abs(
          Number(ledgerEntry.creditAmount) -
            Number(bankTransaction.creditAmount),
        ) > AMOUNT_EPSILON)
    ) {
      throw new BadRequestException(
        'This bank credit does not match that ledger entry - it must be a RECEIPT for the same amount.',
      );
    }

    if (
      !isReceipt &&
      (ledgerEntry.transactionType !== 'PAYMENT' ||
        Math.abs(
          Number(ledgerEntry.debitAmount) -
            Number(bankTransaction.debitAmount),
        ) > AMOUNT_EPSILON)
    ) {
      throw new BadRequestException(
        'This bank debit does not match that ledger entry - it must be a PAYMENT for the same amount.',
      );
    }

    const alreadyLinked = await this.prisma.bankTransaction.findFirst(
      {
        where: {
          status: 'MATCHED',
          matchedLedgerEntryId: dto.ledgerEntryId,
        },
      },
    );

    if (alreadyLinked) {
      throw new BadRequestException(
        'That ledger entry is already matched to another bank transaction.',
      );
    }

    const updated = await this.prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        status: 'MATCHED',
        matchedLedgerEntryId: dto.ledgerEntryId,
      },
    });

    await this.auditService.record(this.prisma, {
      actorId: actor?.id,
      actorName: actor?.name,
      action: 'BANK_TRANSACTION_MATCHED',
      entityType: 'BankTransaction',
      entityId: bankTransactionId,
      details: {
        ledgerEntryId: dto.ledgerEntryId,
        amount: isReceipt
          ? Number(bankTransaction.creditAmount)
          : Number(bankTransaction.debitAmount),
      },
    });

    return updated;
  }

  async unmatch(bankTransactionId: string, actor?: AuditActor) {
    const bankTransaction = await this.getBankTransaction(
      bankTransactionId,
    );

    if (bankTransaction.status !== 'MATCHED') {
      throw new BadRequestException(
        'This transaction is not currently matched.',
      );
    }

    const updated = await this.prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: { status: 'UNMATCHED', matchedLedgerEntryId: null },
    });

    await this.auditService.record(this.prisma, {
      actorId: actor?.id,
      actorName: actor?.name,
      action: 'BANK_TRANSACTION_UNMATCHED',
      entityType: 'BankTransaction',
      entityId: bankTransactionId,
      details: {
        previousLedgerEntryId:
          bankTransaction.matchedLedgerEntryId,
      },
    });

    return updated;
  }

  async ignore(bankTransactionId: string, actor?: AuditActor) {
    const bankTransaction = await this.getBankTransaction(
      bankTransactionId,
    );

    if (bankTransaction.status !== 'UNMATCHED') {
      throw new BadRequestException(
        'Only an unmatched transaction can be ignored.',
      );
    }

    const updated = await this.prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: { status: 'IGNORED' },
    });

    await this.auditService.record(this.prisma, {
      actorId: actor?.id,
      actorName: actor?.name,
      action: 'BANK_TRANSACTION_IGNORED',
      entityType: 'BankTransaction',
      entityId: bankTransactionId,
    });

    return updated;
  }

  async reconciliationSummary(bankAccountId: string) {
    const account = await this.assertBankAccountExists(
      bankAccountId,
    );

    const [transactions, ledgerAgg] = await Promise.all([
      this.prisma.bankTransaction.findMany({
        where: { bankAccountId },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          bankAccountId,
          transactionType: { in: ['RECEIPT', 'PAYMENT'] },
        },
        _sum: { debitAmount: true, creditAmount: true },
      }),
    ]);

    let statementCredits = 0;
    let statementDebits = 0;
    let unmatchedCount = 0;
    let matchedCount = 0;
    let ignoredCount = 0;
    let unmatchedCredits = 0;
    let unmatchedDebits = 0;

    for (const row of transactions) {
      statementCredits += Number(row.creditAmount);
      statementDebits += Number(row.debitAmount);

      if (row.status === 'MATCHED') matchedCount++;
      else if (row.status === 'IGNORED') ignoredCount++;
      else {
        unmatchedCount++;
        unmatchedCredits += Number(row.creditAmount);
        unmatchedDebits += Number(row.debitAmount);
      }
    }

    const openingBalance = Number(account.openingBalance);
    const statementBalance =
      openingBalance + statementCredits - statementDebits;

    const bookCredits = Number(
      ledgerAgg._sum.creditAmount || 0,
    );
    const bookDebits = Number(ledgerAgg._sum.debitAmount || 0);
    const bookBalance =
      openingBalance + bookCredits - bookDebits;

    return {
      bankAccountId,
      openingBalance,
      statementBalance: Number(statementBalance.toFixed(2)),
      bookBalance: Number(bookBalance.toFixed(2)),
      difference: Number(
        (statementBalance - bookBalance).toFixed(2),
      ),
      transactionCount: transactions.length,
      matchedCount,
      unmatchedCount,
      ignoredCount,
      unmatchedCredits: Number(unmatchedCredits.toFixed(2)),
      unmatchedDebits: Number(unmatchedDebits.toFixed(2)),
    };
  }

  private async getBankTransaction(id: string) {
    const bankTransaction =
      await this.prisma.bankTransaction.findUnique({
        where: { id },
      });

    if (!bankTransaction) {
      throw new NotFoundException(
        'Bank transaction not found.',
      );
    }

    return bankTransaction;
  }

  private async assertBankAccountExists(bankAccountId: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!account) {
      throw new BadRequestException(
        'Invalid bank account.',
      );
    }

    return account;
  }

  private assertOneSidedAmount(row: {
    debitAmount?: number;
    creditAmount?: number;
  }) {
    const debit = row.debitAmount ?? 0;
    const credit = row.creditAmount ?? 0;

    if (debit > 0 && credit > 0) {
      throw new BadRequestException(
        'A bank transaction line cannot have both a debit and a credit amount.',
      );
    }

    if (debit === 0 && credit === 0) {
      throw new BadRequestException(
        'A bank transaction line must have a non-zero debit or credit amount.',
      );
    }
  }

  private async resolvePartyNames(
    entries: Array<{ partyType: string; partyId: string }>,
  ) {
    const customerIds = entries
      .filter((e) => e.partyType === 'CUSTOMER')
      .map((e) => e.partyId);

    const supplierIds = entries
      .filter((e) => e.partyType === 'SUPPLIER')
      .map((e) => e.partyId);

    const [customers, suppliers] = await Promise.all([
      customerIds.length
        ? this.prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      supplierIds.length
        ? this.prisma.supplier.findMany({
            where: { id: { in: supplierIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const map = new Map<string, string>();
    for (const c of customers) map.set(c.id, c.name);
    for (const s of suppliers) map.set(s.id, s.name);

    return map;
  }
}
