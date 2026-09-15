import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SaveHeldSaleDto } from '../dto/save-held-sale.dto';

@Injectable()
export class HeldSaleService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: SaveHeldSaleDto) {
    this.validate(dto);

    return this.prisma.heldSale.create({
      data: this.toPersistenceData(dto),
    });
  }

  async findAll() {
    return this.prisma.heldSale.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const heldSale = await this.prisma.heldSale.findUnique({
      where: { id },
    });

    if (!heldSale) {
      throw new NotFoundException('Held bill not found.');
    }

    return heldSale;
  }

  async update(id: string, dto: SaveHeldSaleDto) {
    await this.findOne(id);
    this.validate(dto);

    return this.prisma.heldSale.update({
      where: { id },
      data: this.toPersistenceData(dto),
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.heldSale.delete({
      where: { id },
    });
  }

  private validate(dto: SaveHeldSaleDto) {
    if (!dto.warehouseId) {
      throw new Error('Warehouse is required to hold a bill.');
    }

    if (!dto.items?.length) {
      throw new Error('Add at least one item before holding a bill.');
    }
  }

  private toPersistenceData(dto: SaveHeldSaleDto) {
    const { holdName, billNo, ...salesPayload } = dto;

    return {
      holdName: holdName?.trim() || null,
      customerId: dto.customerId || null,
      warehouseId: dto.warehouseId,
      payload: salesPayload as unknown as Prisma.InputJsonValue,
    };
  }
}
