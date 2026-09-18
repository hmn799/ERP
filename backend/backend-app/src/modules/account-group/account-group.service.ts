import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountGroupDto } from "./dto/create-account-group.dto";
import { UpdateAccountGroupDto } from "./dto/update-account-group.dto";

@Injectable()
export class AccountGroupService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateAccountGroupDto) {
    return this.prisma.accountGroup.create({
      data: {
        name: dto.name,
        natureType: dto.natureType,
        description: dto.description,
      },
    });
  }

  findAll() {
    return this.prisma.accountGroup.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.accountGroup.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    dto: UpdateAccountGroupDto,
  ) {
    return this.prisma.accountGroup.update({
      where: { id },
      data: {
        name: dto.name,
        natureType: dto.natureType,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
  }

  remove(id: string) {
    return this.prisma.accountGroup.delete({
      where: { id },
    });
  }
}
