import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DocumentNumberService } from '../../core/document-number/document-number.service';
import { LedgerService } from '../ledger/ledger.service';

import { CreatePettyExpenseDto } from './dto/create-petty-expense.dto';

@Injectable()
export class PettyExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentNumberService: DocumentNumberService,
    private readonly ledgerService: LedgerService,
  ) {}

  async create(dto: CreatePettyExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      const expenseNo =
        await this.documentNumberService.nextInTransaction(
          'PE',
          tx,
        );

      const expenseDate = dto.expenseDate
        ? new Date(dto.expenseDate)
        : new Date();

      const paymentMode = dto.paymentMode ?? 'CASH';

      const expense = await tx.pettyExpense.create({
        data: {
          expenseNo,
          expenseDate,
          category: dto.category,
          amount: dto.amount,
          paymentMode,
          remarks: dto.remarks,
        },
      });

      await this.ledgerService.postPettyExpense(
        dto.amount,
        paymentMode,
        expense.id,
        `Petty Expense: ${dto.category}${
          dto.remarks ? ` - ${dto.remarks}` : ''
        }`,
        tx,
      );

      return expense;
    });
  }

  /*
   * The dashboard widget's "recent" list plus a running today's
   * total - the only place this feature surfaces, per how it was
   * scoped (a quick-entry widget, not a dedicated report page).
   */
  async recent(limit = 10) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [entries, todayEntries] = await Promise.all([
      this.prisma.pettyExpense.findMany({
        orderBy: { expenseDate: 'desc' },
        take: limit,
      }),
      this.prisma.pettyExpense.findMany({
        where: { expenseDate: { gte: startOfToday } },
        select: { amount: true },
      }),
    ]);

    const todayTotal = todayEntries.reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return {
      entries,
      todayTotal: Number(todayTotal.toFixed(2)),
      todayCount: todayEntries.length,
    };
  }
}
