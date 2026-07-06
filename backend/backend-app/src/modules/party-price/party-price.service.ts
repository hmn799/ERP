import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, PriceSource } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePartyPriceDto } from './dto/create-party-price.dto';
import { UpdatePartyPriceDto } from './dto/update-party-price.dto';

@Injectable()
export class PartyPriceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePartyPriceDto) {
    await this.validateCreate(dto);

    return this.prisma.$transaction(async (tx) => {
      const partyPrice = await tx.partyPrice.create({
        data: {
          customerId: dto.customerId,
          itemId: dto.itemId,

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
    return this.prisma.partyPrice.findMany({
      where: {
        customerId,
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

    return this.prisma.partyPrice.update({
      where: { id },
      data: {
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