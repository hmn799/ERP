import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSchemeDto } from './dto/create-scheme.dto';
import { UpdateSchemeDto } from './dto/update-scheme.dto';

/*
 * The DTO validates effectiveFrom/effectiveTo as date-only or ISO
 * strings (or null, to clear), but Prisma's DateTime column needs a
 * real Date - "2026-10-01" alone throws "premature end of input".
 * undefined passes through unchanged (Prisma treats it as "omit
 * this field" on update, which is what leaves an untouched date
 * alone).
 */
function toDateTime(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

@Injectable()
export class SchemeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private validate(
    dto: CreateSchemeDto | UpdateSchemeDto,
    schemeType: string | undefined,
  ) {
    if (schemeType === 'QUANTITY') {
      if (!dto.buyQty || !dto.freeQty) {
        throw new BadRequestException(
          'QUANTITY schemes require buyQty and freeQty.',
        );
      }
    }

    if (schemeType === 'FREE_ITEM') {
      if (
        !dto.buyQty ||
        !dto.freeQty ||
        !dto.freeItemId
      ) {
        throw new BadRequestException(
          'FREE_ITEM schemes require buyQty, freeQty and freeItemId.',
        );
      }
    }

    if (schemeType === 'DISCOUNT') {
      if (!dto.discountPercent) {
        throw new BadRequestException(
          'DISCOUNT schemes require discountPercent.',
        );
      }
    }
  }

  create(dto: CreateSchemeDto) {
    this.validate(dto, dto.schemeType);

    return this.prisma.scheme.create({
      data: {
        name: dto.name,
        schemeType: dto.schemeType,
        itemId: dto.itemId,
        buyQty: dto.buyQty,
        freeQty: dto.freeQty,
        freeItemId: dto.freeItemId,
        discountPercent: dto.discountPercent,
        isActive: dto.isActive ?? true,
        effectiveFrom: toDateTime(dto.effectiveFrom),
        effectiveTo: toDateTime(dto.effectiveTo),
      },
    });
  }

  findAll() {
    return this.prisma.scheme.findMany({
      include: {
        item: {
          select: { id: true, itemCode: true, name: true },
        },
        freeItem: {
          select: { id: true, itemCode: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const scheme = await this.prisma.scheme.findUnique({
      where: { id },
      include: {
        item: {
          select: { id: true, itemCode: true, name: true },
        },
        freeItem: {
          select: { id: true, itemCode: true, name: true },
        },
      },
    });

    if (!scheme) {
      throw new NotFoundException('Scheme not found.');
    }

    return scheme;
  }

  async update(id: string, dto: UpdateSchemeDto) {
    const existing = await this.findOne(id);

    const schemeType =
      dto.schemeType ?? existing.schemeType;

    this.validate(
      { ...existing, ...dto } as CreateSchemeDto,
      schemeType,
    );

    return this.prisma.scheme.update({
      where: { id },
      data: {
        name: dto.name,
        schemeType: dto.schemeType,
        itemId: dto.itemId,
        buyQty: dto.buyQty,
        freeQty: dto.freeQty,
        freeItemId: dto.freeItemId,
        discountPercent: dto.discountPercent,
        isActive: dto.isActive,
        effectiveFrom: toDateTime(dto.effectiveFrom),
        effectiveTo: toDateTime(dto.effectiveTo),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.scheme.delete({
      where: { id },
    });
  }
}
