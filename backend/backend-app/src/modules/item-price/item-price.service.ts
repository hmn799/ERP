import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, PriceSource } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateItemPriceDto } from './dto/create-item-price.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';


@Injectable()
export class ItemPriceService {
  constructor(
  private readonly prisma: PrismaService,
) {}

  async create(dto: CreateItemPriceDto) {
    await this.validateCreate(dto);

    return this.prisma.$transaction(async (tx) => {
      const itemPrice = await tx.itemPrice.create({
        data: {
          itemId: dto.itemId,
          priceListId: dto.priceListId,

          minQty: dto.minQty,

          salePrice: dto.salePrice,

          minimumPrice: dto.minimumPrice,

          maximumDiscountPercent:
            dto.maximumDiscountPercent,

          effectiveFrom: dto.effectiveFrom,

          effectiveTo: dto.effectiveTo,

          allowManualOverride:
            dto.allowManualOverride ?? true,

          isActive: dto.isActive ?? true,
        },
        include: {
          item: true,
          priceList: true,
        },
      });

      await tx.priceHistory.create({
        data: {
          itemId: dto.itemId,

          priceListId: dto.priceListId,

          oldPrice: new Prisma.Decimal(0),

          newPrice: new Prisma.Decimal(dto.salePrice),

          priceSource: PriceSource.MANUAL,

          changedBy: dto.changedBy,

          remarks:
            dto.remarks ?? 'Initial price created',
        },
      });

      return itemPrice;
    });
  }

  async findAll() {
    return this.prisma.itemPrice.findMany({
      include: {
        item: true,
        priceList: true,
      },
      orderBy: [
        {
          item: {
            name: 'asc',
          },
        },
        {
          priceList: {
            priority: 'asc',
          },
        },
      ],
    });
  }

  async findOne(id: string) {
    const itemPrice =
      await this.prisma.itemPrice.findUnique({
        where: {
          id,
        },
        include: {
          item: true,
          priceList: true,
        },
      });

    if (!itemPrice) {
      throw new NotFoundException(
        'Item Price not found',
      );
    }

    return itemPrice;
  }

  async findByItem(itemId: string) {
    return this.prisma.itemPrice.findMany({
      where: {
        itemId,
        isActive: true,
      },
      include: {
        priceList: true,
      },
      orderBy: {
        priceList: {
          priority: 'asc',
        },
      },
    });
  }

  async findByPriceList(priceListId: string) {
    return this.prisma.itemPrice.findMany({
      where: {
        priceListId,
        isActive: true,
      },
      include: {
        item: true,
      },
      orderBy: {
        item: {
          name: 'asc',
        },
      },
    });
  }
    async update(id: string, dto: UpdateItemPriceDto) {
    const existing = await this.prisma.itemPrice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Item Price not found');
    }

    await this.validateUpdate(existing, dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.itemPrice.update({
        where: { id },
        data: {
          minQty: dto.minQty ?? existing.minQty,
          salePrice: dto.salePrice ?? existing.salePrice,
          minimumPrice:
            dto.minimumPrice ?? existing.minimumPrice,
          maximumDiscountPercent:
            dto.maximumDiscountPercent ??
            existing.maximumDiscountPercent,
          effectiveFrom:
            dto.effectiveFrom ?? existing.effectiveFrom,
          effectiveTo:
            dto.effectiveTo ?? existing.effectiveTo,
          allowManualOverride:
            dto.allowManualOverride ??
            existing.allowManualOverride,
          isActive:
            dto.isActive ?? existing.isActive,
        },
        include: {
          item: true,
          priceList: true,
        },
      });

      if (
        dto.salePrice !== undefined &&
        Number(existing.salePrice) !== Number(dto.salePrice)
      ) {
        await tx.priceHistory.create({
          data: {
            itemId: existing.itemId,
            priceListId: existing.priceListId,
            oldPrice: existing.salePrice,
            newPrice: new Prisma.Decimal(dto.salePrice),
            priceSource: PriceSource.MANUAL,
            changedBy: dto.changedBy,
            remarks:
              dto.remarks ?? 'Price updated',
          },
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.itemPrice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Item Price not found');
    }

    return this.prisma.itemPrice.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  private async validateCreate(
    dto: CreateItemPriceDto,
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });

    if (!item) {
      throw new BadRequestException('Invalid Item');
    }

    const priceList =
      await this.prisma.priceList.findUnique({
        where: { id: dto.priceListId },
      });

    if (!priceList) {
      throw new BadRequestException(
        'Invalid Price List',
      );
    }

    const duplicateTier =
      await this.prisma.itemPrice.findFirst({
        where: {
          itemId: dto.itemId,
          priceListId: dto.priceListId,
          minQty: dto.minQty ?? 1,
          isActive: true,
        },
      });

    if (duplicateTier) {
      throw new BadRequestException(
        `A tier starting at qty ${dto.minQty ?? 1} already exists for this item on this price list.`,
      );
    }

    if (
      dto.minimumPrice !== undefined &&
      dto.minimumPrice > dto.salePrice
    ) {
      throw new BadRequestException(
        'Minimum price cannot exceed sale price',
      );
    }

    if (
      dto.maximumDiscountPercent !== undefined &&
      (dto.maximumDiscountPercent < 0 ||
        dto.maximumDiscountPercent > 100)
    ) {
      throw new BadRequestException(
        'Maximum discount must be between 0 and 100',
      );
    }

    if (
      dto.effectiveFrom &&
      dto.effectiveTo &&
      dto.effectiveTo < dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Effective To cannot be before Effective From',
      );
    }
  }

  private async validateUpdate(
    existing: any,
    dto: UpdateItemPriceDto,
  ) {
    if (
      dto.minQty !== undefined &&
      Number(dto.minQty) !== Number(existing.minQty)
    ) {
      const duplicateTier =
        await this.prisma.itemPrice.findFirst({
          where: {
            id: { not: existing.id },
            itemId: existing.itemId,
            priceListId: existing.priceListId,
            minQty: dto.minQty,
            isActive: true,
          },
        });

      if (duplicateTier) {
        throw new BadRequestException(
          `A tier starting at qty ${dto.minQty} already exists for this item on this price list.`,
        );
      }
    }

    const salePrice =
      dto.salePrice ?? Number(existing.salePrice);

    const minimumPrice =
      dto.minimumPrice ??
      (existing.minimumPrice
        ? Number(existing.minimumPrice)
        : undefined);

    if (
      minimumPrice !== undefined &&
      minimumPrice > salePrice
    ) {
      throw new BadRequestException(
        'Minimum price cannot exceed sale price',
      );
    }

    if (
      dto.effectiveFrom &&
      dto.effectiveTo &&
      dto.effectiveTo < dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Effective To cannot be before Effective From',
      );
    }
  }
}