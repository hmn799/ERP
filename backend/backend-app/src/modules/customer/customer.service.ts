import { Injectable } from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.$transaction(async (tx) => {
      const customerCode =
        dto.customerCode?.trim() ||
        (await this.nextCustomerCode(tx));

      return tx.customer.create({
        data: {
          customerCode,
          name: dto.name,

          customerGroup: dto.customerGroup,

          // Defaults to customerGroup when not sent separately -
          // the one dropdown the operator sees drives both, but
          // this keeps pricing correct even for a caller that only
          // sends customerGroup.
          priceLevel:
            dto.priceLevel ?? dto.customerGroup,

          priceListId: dto.priceListId,

          gstCategory: dto.gstCategory,
          gstin: dto.gstin,

          mobile: dto.mobile,
          email: dto.email,

          address: dto.address,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,

          openingBalance: dto.openingBalance ?? 0,
          creditLimit: dto.creditLimit ?? 0,

          routeId: dto.routeId,
          salesmanId: dto.salesmanId,

          isActive: dto.isActive ?? true,
        },
        include: {
          priceList: true,
          route: true,
          salesman: true,
        },
      });
    });
  }

  /*
   * CUS00001, CUS00002, ... - based on the highest existing code
   * that already matches this pattern, so legacy/manually-entered
   * codes in other formats never disrupt numbering. Runs inside the
   * caller's transaction so a concurrent create can't compute the
   * same next number.
   */
  private async nextCustomerCode(
    tx: Prisma.TransactionClient,
  ) {
    const customers = await tx.customer.findMany({
      where: {
        customerCode: {
          startsWith: "CUS",
        },
      },
      select: {
        customerCode: true,
      },
    });

    const maxNumber = customers.reduce(
      (max, customer) => {
        const match =
          customer.customerCode.match(
            /^CUS(\d+)$/,
          );

        const value = match
          ? parseInt(match[1], 10)
          : 0;

        return Math.max(max, value);
      },
      0,
    );

    return `CUS${(maxNumber + 1)
      .toString()
      .padStart(5, "0")}`;
  }

  findAll() {
    return this.prisma.customer.findMany({
      include: {
        priceList: true,
        route: true,
        salesman: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        priceList: true,
        route: true,
        salesman: true,
      },
    });
  }

  update(
    id: string,
    dto: UpdateCustomerDto,
  ) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        customerCode: dto.customerCode,
        name: dto.name,

        customerGroup: dto.customerGroup,

        priceLevel:
          dto.priceLevel ?? dto.customerGroup,

        priceListId: dto.priceListId,

        gstCategory: dto.gstCategory,
        gstin: dto.gstin,

        mobile: dto.mobile,
        email: dto.email,

        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,

        openingBalance: dto.openingBalance,
        creditLimit: dto.creditLimit,

        routeId: dto.routeId,
        salesmanId: dto.salesmanId,

        isActive: dto.isActive,
      },
      include: {
        priceList: true,
        route: true,
        salesman: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}