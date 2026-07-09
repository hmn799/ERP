import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    dto: UpdateCategoryDto,
  ) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}