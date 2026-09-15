import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../modules/prisma/prisma.service';

import { CreateDocumentSeriesDto } from './dto/create-document-series.dto';
import { UpdateDocumentSeriesDto } from './dto/update-document-series.dto';

@Injectable()
export class DocumentNumberService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateDocumentSeriesDto,
  ) {
    const existing =
      await this.prisma.documentSeries.findUnique({
        where: {
          documentType: dto.documentType,
        },
      });

    if (existing) {
      throw new ConflictException(
        'Document Series already exists.',
      );
    }

    return this.prisma.documentSeries.create({
      data: {
        documentType: dto.documentType,

        name: dto.name,

        prefix: dto.prefix,

        suffix: dto.suffix,

        padding: dto.padding,

        currentNumber:
          dto.currentNumber,

        resetYearly:
          dto.resetYearly,

        financialYear:
          dto.financialYear,

        isActive:
          dto.isActive,
      },
    });
  }

  async findAll() {
    return this.prisma.documentSeries.findMany({
      orderBy: {
        documentType: 'asc',
      },
    });
  }

  async findOne(
    id: string,
  ) {
    const series =
      await this.prisma.documentSeries.findUnique({
        where: {
          id,
        },
      });

    if (!series) {
      throw new NotFoundException(
        'Document Series not found.',
      );
    }

    return series;
  }

  async update(
    id: string,
    dto: UpdateDocumentSeriesDto,
  ) {
    await this.findOne(id);

    return this.prisma.documentSeries.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id);

    return this.prisma.documentSeries.delete({
      where: {
        id,
      },
    });
  }
    async preview(
    documentType: string,
  ) {
    const series =
      await this.prisma.documentSeries.findUnique({
        where: {
          documentType,
        },
      });

    if (!series) {
      throw new NotFoundException(
        `Document Series '${documentType}' not found.`,
      );
    }

    const nextNumber =
      series.currentNumber + 1;

    return this.formatDocumentNumber(
      series.prefix,
      nextNumber,
      series.padding,
      series.suffix,
    );
  }

  async next(
    documentType: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        return this.nextInTransaction(
          documentType,
          tx,
        );
      },
    );
  }

  async nextInTransaction(
    documentType: string,
    tx: Prisma.TransactionClient,
  ) {
    const series =
      await tx.documentSeries.findUnique({
        where: {
          documentType,
        },
      });

    if (!series) {
      throw new NotFoundException(
        `Document Series '${documentType}' not found.`,
      );
    }

    const updatedSeries =
      await tx.documentSeries.update({
        where: {
          id: series.id,
        },
        data: {
          currentNumber: {
            increment: 1,
          },
        },
      });

    return this.formatDocumentNumber(
      updatedSeries.prefix,
      updatedSeries.currentNumber,
      updatedSeries.padding,
      updatedSeries.suffix,
    );
  }

  private formatDocumentNumber(
    prefix: string,
    number: number,
    padding: number,
    suffix?: string | null,
  ) {
    const padded =
      number
        .toString()
        .padStart(padding, '0');

    return `${prefix}${padded}${suffix ?? ''}`;
  }
  }
