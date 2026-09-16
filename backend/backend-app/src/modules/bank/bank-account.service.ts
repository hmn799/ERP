import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({
      data: {
        name: dto.name,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode,
        openingBalance: dto.openingBalance ?? 0,
      },
    });
  }

  async findAll() {
    return this.prisma.bankAccount.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(
        'Bank account not found.',
      );
    }

    return account;
  }

  async update(id: string, dto: UpdateBankAccountDto) {
    await this.findOne(id);

    return this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
  }
}
