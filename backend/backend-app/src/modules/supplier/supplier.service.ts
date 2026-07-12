import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SupplierService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
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

        openingBalance: dto.openingBalance ?? 0,

        isActive: dto.isActive ?? true,
      },
    });
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