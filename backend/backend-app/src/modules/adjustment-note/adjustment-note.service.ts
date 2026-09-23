import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DocumentNumberService } from '../../core/document-number/document-number.service';
import { LedgerService } from '../ledger/ledger.service';
import { FinancialYearGuardService } from '../financial-year/financial-year-guard.service';

import { CreateAdjustmentNoteDto } from './dto/create-adjustment-note.dto';

@Injectable()
export class AdjustmentNoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentNumberService: DocumentNumberService,
    private readonly ledgerService: LedgerService,
    private readonly financialYearGuardService: FinancialYearGuardService,
  ) {}

  async create(dto: CreateAdjustmentNoteDto) {
    await this.financialYearGuardService.assertDateNotClosed(
      dto.noteDate,
    );

    const partyType =
      dto.noteType === 'DEBIT' ? 'SUPPLIER' : 'CUSTOMER';

    return this.prisma.$transaction(async (tx) => {
      const party =
        partyType === 'SUPPLIER'
          ? await tx.supplier.findUnique({
              where: { id: dto.partyId },
            })
          : await tx.customer.findUnique({
              where: { id: dto.partyId },
            });

      if (!party) {
        throw new BadRequestException(
          `Invalid ${partyType.toLowerCase()}.`,
        );
      }

      let taxableAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let netAmount = 0;

      const itemsData = dto.items.map((item) => {
        const gstAmount =
          (item.taxableAmount * item.gstPercent) / 100;

        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;
        const net = item.taxableAmount + gstAmount;

        taxableAmount += item.taxableAmount;
        cgstAmount += cgst;
        sgstAmount += sgst;
        netAmount += net;

        return {
          description: item.description,
          hsnCode: item.hsnCode,
          taxableAmount: item.taxableAmount,
          gstPercent: item.gstPercent,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: 0,
          netAmount: net,
        };
      });

      const noteNo =
        await this.documentNumberService.nextInTransaction(
          dto.noteType === 'DEBIT' ? 'DN' : 'CN',
          tx,
        );

      const note = await tx.adjustmentNote.create({
        data: {
          noteNo,
          noteType: dto.noteType,
          noteDate: new Date(dto.noteDate),
          partyType,
          partyId: dto.partyId,
          reason: dto.reason,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount: 0,
          netAmount,
          items: { create: itemsData },
        },
        include: { items: true },
      });

      if (dto.noteType === 'DEBIT') {
        await this.ledgerService.postDebitNote(
          dto.partyId,
          netAmount,
          note.id,
          tx,
        );
      } else {
        await this.ledgerService.postCreditNote(
          dto.partyId,
          netAmount,
          note.id,
          tx,
        );
      }

      return note;
    });
  }

  async findAll(noteType?: 'DEBIT' | 'CREDIT') {
    const notes = await this.prisma.adjustmentNote.findMany({
      where: noteType ? { noteType } : undefined,
      include: { items: true },
      orderBy: { noteDate: 'desc' },
    });

    return this.withPartyNames(notes);
  }

  async findOne(id: string) {
    const note = await this.prisma.adjustmentNote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!note) {
      throw new NotFoundException(
        'Adjustment note not found.',
      );
    }

    const [withName] = await this.withPartyNames([note]);

    return withName;
  }

  /*
   * Reverses a debit/credit note raised by mistake - posts an
   * opposite-signed ledger entry (the original stays, for audit)
   * and marks the note CANCELLED so it's visibly inactive.
   */
  async cancel(id: string) {
    const existing = await this.prisma.adjustmentNote.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        'Adjustment note not found.',
      );
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException(
        'This note is already cancelled.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ledgerService.reverseAdjustmentNote(
        existing.partyType as 'SUPPLIER' | 'CUSTOMER',
        existing.partyId,
        Number(existing.netAmount),
        existing.id,
        tx,
      );

      return tx.adjustmentNote.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });
  }

  private async withPartyNames<
    T extends { partyType: string; partyId: string },
  >(notes: T[]) {
    const customerIds = notes
      .filter((n) => n.partyType === 'CUSTOMER')
      .map((n) => n.partyId);

    const supplierIds = notes
      .filter((n) => n.partyType === 'SUPPLIER')
      .map((n) => n.partyId);

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

    const names = new Map<string, string>();
    for (const c of customers) names.set(c.id, c.name);
    for (const s of suppliers) names.set(s.id, s.name);

    return notes.map((note) => ({
      ...note,
      partyName: names.get(note.partyId) ?? 'Unknown',
    }));
  }
}
