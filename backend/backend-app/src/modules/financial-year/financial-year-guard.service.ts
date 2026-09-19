import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

/*
 * Injected into the money/stock-moving save services (Sales,
 * Purchase, Receipts/Payments) to block backdating a new
 * transaction into a financial year that's already been closed.
 * Deliberately does nothing else - no side effects, just a
 * validation check - so adding it to an existing save path is a
 * single extra line, not a restructure.
 */
@Injectable()
export class FinancialYearGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async assertDateNotClosed(date: Date | string | undefined | null) {
    if (!date) return;

    const target = new Date(date);

    if (Number.isNaN(target.getTime())) return;

    const closedYear = await this.prisma.financialYear.findFirst({
      where: {
        isClosed: true,
        startDate: { lte: target },
        endDate: { gte: target },
      },
    });

    if (closedYear) {
      throw new BadRequestException(
        `This date falls within "${closedYear.name}", which has been closed. Choose a later date, or reopen that financial year first.`,
      );
    }
  }
}
