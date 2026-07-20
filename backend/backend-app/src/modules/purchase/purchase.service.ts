import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PurchaseSaveService } from './services/purchase-save.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseEditService } from './services/purchase-edit.service';

@Injectable()
export class PurchaseService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly purchaseSaveService: PurchaseSaveService,

  private readonly purchaseEditService: PurchaseEditService,
) {}

  async create(dto: CreatePurchaseDto) {
    return this.purchaseSaveService.savePurchase(dto);
  }

  async update(
  id: string,
  dto: CreatePurchaseDto,
) {
  return this.purchaseEditService.editPurchase(
    id,
    dto,
  );
}

  async findAll() {
    return this.prisma.purchaseBill.findMany({
      include: {
        supplier: true,
        warehouse: true,
        items: true,
      },
      orderBy: {
        billDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.purchaseBill.findUnique({
      where: {
        id,
      },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            item: true,
            batch: true,
          },
        },
      },
    });
  }
}