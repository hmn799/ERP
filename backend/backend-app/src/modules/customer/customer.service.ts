import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        customerCode: dto.customerCode,
        name: dto.name,

        customerGroup: dto.customerGroup,
        priceLevel: dto.priceLevel,

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
      },
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        route: true,
        salesman: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: {
        id,
      },
      include: {
        route: true,
        salesman: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.customer.delete({
      where: {
        id,
      },
    });
  }
}