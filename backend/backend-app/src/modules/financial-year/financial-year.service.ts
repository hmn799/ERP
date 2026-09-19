import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateFinancialYearDto } from "./dto/create-financial-year.dto";

@Injectable()
export class FinancialYearService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFinancialYearDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        "End date must be after start date.",
      );
    }

    const overlapping = await this.prisma.financialYear.findFirst({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        `This date range overlaps with an existing financial year (${overlapping.name}).`,
      );
    }

    return this.prisma.financialYear.create({
      data: { name: dto.name, startDate, endDate },
    });
  }

  async findAll() {
    return this.prisma.financialYear.findMany({
      orderBy: { startDate: "desc" },
    });
  }

  async findOne(id: string) {
    const fy = await this.prisma.financialYear.findUnique({
      where: { id },
      include: {
        closingBalances: {
          orderBy: { closingBalance: "desc" },
        },
      },
    });

    if (!fy) {
      throw new NotFoundException("Financial year not found.");
    }

    return fy;
  }

  async close(id: string) {
    const fy = await this.prisma.financialYear.findUnique({
      where: { id },
    });

    if (!fy) {
      throw new NotFoundException("Financial year not found.");
    }

    if (fy.isClosed) {
      throw new BadRequestException(
        "Financial year is already closed.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const customers = await tx.customer.findMany({
        where: { isActive: true },
      });

      const suppliers = await tx.supplier.findMany({
        where: { isActive: true },
      });

      for (const customer of customers) {
        const balance = await this.balanceAsOf(
          tx,
          "CUSTOMER",
          customer.id,
          fy.endDate,
          true,
        );

        if (balance === 0) continue;

        await tx.financialYearClosingBalance.upsert({
          where: {
            financialYearId_partyType_partyId: {
              financialYearId: fy.id,
              partyType: "CUSTOMER",
              partyId: customer.id,
            },
          },
          create: {
            financialYearId: fy.id,
            partyType: "CUSTOMER",
            partyId: customer.id,
            partyName: customer.name,
            closingBalance: balance,
          },
          update: {
            closingBalance: balance,
            partyName: customer.name,
          },
        });
      }

      for (const supplier of suppliers) {
        const balance = await this.balanceAsOf(
          tx,
          "SUPPLIER",
          supplier.id,
          fy.endDate,
          false,
        );

        if (balance === 0) continue;

        await tx.financialYearClosingBalance.upsert({
          where: {
            financialYearId_partyType_partyId: {
              financialYearId: fy.id,
              partyType: "SUPPLIER",
              partyId: supplier.id,
            },
          },
          create: {
            financialYearId: fy.id,
            partyType: "SUPPLIER",
            partyId: supplier.id,
            partyName: supplier.name,
            closingBalance: balance,
          },
          update: {
            closingBalance: balance,
            partyName: supplier.name,
          },
        });
      }

      return tx.financialYear.update({
        where: { id: fy.id },
        data: { isClosed: true, closedAt: new Date() },
        include: { closingBalances: true },
      });
    });
  }

  async reopen(id: string) {
    const fy = await this.prisma.financialYear.findUnique({
      where: { id },
    });

    if (!fy) {
      throw new NotFoundException("Financial year not found.");
    }

    if (!fy.isClosed) {
      throw new BadRequestException(
        "Financial year is not closed.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.financialYearClosingBalance.deleteMany({
        where: { financialYearId: fy.id },
      });

      return tx.financialYear.update({
        where: { id: fy.id },
        data: { isClosed: false, closedAt: null },
      });
    });
  }

  /*
   * Customer balance = debit - credit ("customer owes us").
   * Supplier balance = credit - debit ("we owe supplier").
   * Scoped to transactionDate <= asOf, so this reflects the
   * party's true position at the financial year's end date, not
   * whatever it happens to be today.
   */
  private async balanceAsOf(
    tx: Prisma.TransactionClient,
    partyType: "CUSTOMER" | "SUPPLIER",
    partyId: string,
    asOf: Date,
    isCustomer: boolean,
  ): Promise<number> {
    const rows = await tx.ledgerEntry.findMany({
      where: {
        partyType,
        partyId,
        transactionDate: { lte: asOf },
      },
    });

    let debit = 0;
    let credit = 0;

    for (const row of rows) {
      debit += Number(row.debitAmount);
      credit += Number(row.creditAmount);
    }

    return Number(
      (isCustomer ? debit - credit : credit - debit).toFixed(2),
    );
  }
}
