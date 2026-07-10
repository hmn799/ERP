import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreateGstSlabDto } from "./dto/create-gst-slab.dto";
import { UpdateGstSlabDto } from "./dto/update-gst-slab.dto";

@Injectable()
export class GstSlabService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateGstSlabDto) {
    return this.prisma.gSTSlab.create({
      data: {
        name: dto.name,
        percentage: dto.percentage,
      },
    });
  }

  findAll() {
    return this.prisma.gSTSlab.findMany({
      orderBy: {
        percentage: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.gSTSlab.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    dto: UpdateGstSlabDto,
  ) {
    return this.prisma.gSTSlab.update({
      where: { id },
      data: {
        name: dto.name,
        percentage: dto.percentage,
      },
    });
  }

  remove(id: string) {
    return this.prisma.gSTSlab.delete({
      where: { id },
    });
  }
}