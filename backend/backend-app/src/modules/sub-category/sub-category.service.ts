import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@Injectable()
export class SubCategoryService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSubCategoryDto) {
    return this.prisma.subCategory.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  findAll() {
    return this.prisma.subCategory.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.subCategory.delete({
      where: { id },
    });
  }
}