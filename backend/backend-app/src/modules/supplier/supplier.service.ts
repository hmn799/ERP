import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        
        supplierCode: dto.supplierCode,
        name: dto.name,
        gstType: dto.gstType,
        gstin: dto.gstin,
        mobile: dto.mobile,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        openingBalance: dto.openingBalance || 0,
      },
    });
  }

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  async remove(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}