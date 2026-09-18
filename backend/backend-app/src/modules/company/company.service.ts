import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { UpdateCompanyDto } from "./dto/update-company.dto";

/*
 * There is exactly one company/shop profile per ERP install - no
 * multi-tenancy here - so this is a singleton: read the first row
 * (or null if the shop hasn't set up its profile yet), and write
 * always upserts that same row instead of requiring an id.
 */
@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProfile() {
    return this.prisma.company.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async updateProfile(
    dto: UpdateCompanyDto,
  ) {
    const existing =
      await this.prisma.company.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    const data = {
      name: dto.name,
      gstin: dto.gstin,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      receiptFontSize: dto.receiptFontSize,
    };

    if (existing) {
      return this.prisma.company.update({
        where: {
          id: existing.id,
        },
        data,
      });
    }

    return this.prisma.company.create({
      data,
    });
  }
}
