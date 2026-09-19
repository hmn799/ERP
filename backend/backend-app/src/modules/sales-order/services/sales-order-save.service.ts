import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SalesOrderGstService } from './sales-order-gst.service';

import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { DocumentNumberService } from '../../../core/document-number/document-number.service';

const DOCUMENT_TYPE = 'SO';

@Injectable()
export class SalesOrderSaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gstService: SalesOrderGstService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  async create(dto: CreateSalesOrderDto) {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found.');
      }
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new BadRequestException('Warehouse not found.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'At least one order item is required.',
      );
    }

    const soNo = await this.documentNumberService.next(DOCUMENT_TYPE);

    let grossAmount = 0;
    let discountAmount = 0;
    let taxableAmount = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    let netAmount = 0;

    const calculatedItems: {
      row: (typeof dto.items)[number];
      calc: ReturnType<SalesOrderGstService['calculate']>;
    }[] = [];

    for (const row of dto.items) {
      const calc = this.gstService.calculate(
        row.qtyOrdered,
        row.saleRate,
        row.discountPercent,
        row.gstPercent,
      );

      grossAmount += calc.grossAmount;
      discountAmount += calc.discountAmount;
      taxableAmount += calc.taxableAmount;
      cgstAmount += calc.cgstAmount;
      sgstAmount += calc.sgstAmount;
      igstAmount += calc.igstAmount;
      netAmount += calc.netAmount;

      calculatedItems.push({ row, calc });
    }

    const salesOrder = await this.prisma.salesOrder.create({
      data: {
        soNo,
        soDate: new Date(dto.orderDate),
        customerId: dto.customerId || null,
        warehouseId: dto.warehouseId,
        status: 'PENDING',
        grossAmount,
        discountAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        netAmount,
        remarks: dto.remarks,
      },
    });

    for (const item of calculatedItems) {
      await this.prisma.salesOrderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          itemId: item.row.itemId,
          qtyOrdered: item.row.qtyOrdered,
          qtyDelivered: 0,
          pendingQty: item.row.qtyOrdered,
          saleRate: item.row.saleRate,
          discountPercent: item.row.discountPercent,
          gstPercent: item.row.gstPercent,
          taxableAmount: item.calc.taxableAmount,
          cgstAmount: item.calc.cgstAmount,
          sgstAmount: item.calc.sgstAmount,
          igstAmount: item.calc.igstAmount,
          netAmount: item.calc.netAmount,
        },
      });
    }

    return this.prisma.salesOrder.findUnique({
      where: { id: salesOrder.id },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { item: true } },
        salesBills: true,
      },
    });
  }
}
