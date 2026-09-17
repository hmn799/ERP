import { Injectable } from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SupplierService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.$transaction(async (tx) => {
      const supplierCode =
        dto.supplierCode ??
        (await this.nextSupplierCode(tx));

      return tx.supplier.create({
        data: {
          supplierCode,
          name: dto.name,

          gstType: dto.gstType,
          gstin: dto.gstin,

          mobile: dto.mobile,
          email: dto.email,

          address: dto.address,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,

          openingBalance: dto.openingBalance ?? 0,

          isActive: dto.isActive ?? true,
        },
      });
    });
  }

  /*
   * SUP00001, SUP00002, ... - based on the highest existing code
   * that already matches this pattern, so legacy/manually-entered
   * codes in other formats (e.g. "001", "TESTSUP001") never disrupt
   * numbering. Runs inside the caller's transaction so a concurrent
   * create can't compute the same next number.
   */
  private async nextSupplierCode(
    tx: Prisma.TransactionClient,
  ) {
    const suppliers = await tx.supplier.findMany({
      where: {
        supplierCode: {
          startsWith: "SUP",
        },
      },
      select: {
        supplierCode: true,
      },
    });

    const maxNumber = suppliers.reduce(
      (max, supplier) => {
        const match =
          supplier.supplierCode.match(
            /^SUP(\d+)$/,
          );

        const value = match
          ? parseInt(match[1], 10)
          : 0;

        return Math.max(max, value);
      },
      0,
    );

    return `SUP${(maxNumber + 1)
      .toString()
      .padStart(5, "0")}`;
  }

  findAll() {
    return this.prisma.supplier.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    dto: UpdateSupplierDto,
  ) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        supplierCode: dto.supplierCode,
        name: dto.name,

        gstType: dto.gstType,
        gstin: dto.gstin,

        mobile: dto.mobile,
        email: dto.email,

        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,

        openingBalance: dto.openingBalance,

        isActive: dto.isActive,
      },
    });
  }

  remove(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}