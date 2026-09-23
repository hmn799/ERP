import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, PriceSource } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePartyPriceDto } from './dto/create-party-price.dto';
import { UpdatePartyPriceDto } from './dto/update-party-price.dto';

import { AuditService, AuditActor } from '../audit/audit.service';

@Injectable()
export class PartyPriceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreatePartyPriceDto,
    actor?: AuditActor,
  ) {
    await this.validateCreate(dto);

    return this.prisma.$transaction(async (tx) => {
      const partyPrice = await tx.partyPrice.create({
        data: {
          customerId: dto.customerId,
          itemId: dto.itemId,

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
          customer: true,
          item: true,
        },
      });

      await this.auditService.record(tx, {
        actorId: actor?.id,
        actorName: actor?.name,
        action: 'PARTY_PRICE_SET',
        entityType: 'PartyPrice',
        entityId: partyPrice.id,
        details: {
          customerId: partyPrice.customerId,
          itemId: partyPrice.itemId,
          salePrice: partyPrice.salePrice,
        },
      });

      return partyPrice;
    });
  }

  async findAll() {
    return this.prisma.partyPrice.findMany({
      include: {
        customer: true,
        item: true,
      },
      orderBy: [
        {
          customer: {
            name: 'asc',
          },
        },
        {
          item: {
            name: 'asc',
          },
        },
      ],
    });
  }

  async findOne(id: string) {
    const partyPrice =
      await this.prisma.partyPrice.findUnique({
        where: { id },
        include: {
          customer: true,
          item: true,
        },
      });

    if (!partyPrice) {
      throw new NotFoundException(
        'Party Price not found',
      );
    }

    return partyPrice;
  }

  async findByCustomer(customerId: string) {
    const now = new Date();

    return this.prisma.partyPrice.findMany({
      where: {
        customerId,
        isActive: true,
        AND: [
          {
            OR: [
              { effectiveFrom: null },
              { effectiveFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: now } },
            ],
          },
        ],
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

  async findByItem(itemId: string) {
    return this.prisma.partyPrice.findMany({
      where: {
        itemId,
        isActive: true,
      },
      include: {
        customer: true,
      },
      orderBy: {
        customer: {
          name: 'asc',
        },
      },
    });
  }
    async update(
    id: string,
    dto: UpdatePartyPriceDto,
    actor?: AuditActor,
  ) {
    const existing =
      await this.prisma.partyPrice.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Party Price not found',
      );
    }

    await this.validateUpdate(existing, dto);

    const updated = await this.prisma.partyPrice.update({
      where: { id },
      data: {
        minQty:
          dto.minQty ?? existing.minQty,

        salePrice:
          dto.salePrice ?? existing.salePrice,

        minimumPrice:
          dto.minimumPrice ??
          existing.minimumPrice,

        maximumDiscountPercent:
          dto.maximumDiscountPercent ??
          existing.maximumDiscountPercent,

        effectiveFrom:
          dto.effectiveFrom ??
          existing.effectiveFrom,

        effectiveTo:
          dto.effectiveTo ??
          existing.effectiveTo,

        allowManualOverride:
          dto.allowManualOverride ??
          existing.allowManualOverride,

        isActive:
          dto.isActive ??
          existing.isActive,
      },
      include: {
        customer: true,
        item: true,
      },
    });

    await this.auditService.record(this.prisma, {
      actorId: actor?.id,
      actorName: actor?.name,
      action: 'PARTY_PRICE_UPDATED',
      entityType: 'PartyPrice',
      entityId: updated.id,
      details: {
        customerId: updated.customerId,
        itemId: updated.itemId,
        salePrice: updated.salePrice,
        previousSalePrice: existing.salePrice,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const existing =
      await this.prisma.partyPrice.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Party Price not found',
      );
    }

    return this.prisma.partyPrice.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  private async validateCreate(
    dto: CreatePartyPriceDto,
  ) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          id: dto.customerId,
        },
      });

    if (!customer) {
      throw new BadRequestException(
        'Invalid Customer',
      );
    }

    const item =
      await this.prisma.item.findUnique({
        where: {
          id: dto.itemId,
        },
      });

    if (!item) {
      throw new BadRequestException(
        'Invalid Item',
      );
    }

    const duplicateTier =
      await this.prisma.partyPrice.findFirst({
        where: {
          customerId: dto.customerId,
          itemId: dto.itemId,
          minQty: dto.minQty ?? 1,
          isActive: true,
        },
      });

    if (duplicateTier) {
      throw new BadRequestException(
        `A tier starting at qty ${dto.minQty ?? 1} already exists for this customer and item.`,
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
      (
        dto.maximumDiscountPercent < 0 ||
        dto.maximumDiscountPercent > 100
      )
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
    existing: Prisma.PartyPriceGetPayload<{}>,
    dto: UpdatePartyPriceDto,
  ) {
    if (
      dto.minQty !== undefined &&
      Number(dto.minQty) !== Number(existing.minQty)
    ) {
      const duplicateTier =
        await this.prisma.partyPrice.findFirst({
          where: {
            id: { not: existing.id },
            customerId: existing.customerId,
            itemId: existing.itemId,
            minQty: dto.minQty,
            isActive: true,
          },
        });

      if (duplicateTier) {
        throw new BadRequestException(
          `A tier starting at qty ${dto.minQty} already exists for this customer and item.`,
        );
      }
    }

    const salePrice =
      dto.salePrice ??
      Number(existing.salePrice);

    const minimumPrice =
      dto.minimumPrice ??
      (
        existing.minimumPrice
          ? Number(existing.minimumPrice)
          : undefined
      );

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
