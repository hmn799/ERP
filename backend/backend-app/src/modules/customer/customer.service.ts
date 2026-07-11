import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        customerCode: dto.customerCode,
        name: dto.name,

        customerGroup: dto.customerGroup,
        priceLevel: dto.priceLevel,
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
        priceLevel: dto.priceLevel,
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