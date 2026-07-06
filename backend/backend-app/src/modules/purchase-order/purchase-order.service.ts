import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

import { PurchaseOrderSaveService } from './services/purchase-order-save.service';
import { PurchaseOrderReceiveService } from './services/purchase-order-receive.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saveService: PurchaseOrderSaveService,
    private readonly receiveService: PurchaseOrderReceiveService,
  ) {}

 async create(
  dto: CreatePurchaseOrderDto,
) {
  return this.saveService.create(dto);
}

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: {
        id,
      },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    return this.receiveService.receive(
      id,
      dto,
    );
  }
}