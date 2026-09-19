import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const SELECT_FIELDS = {
  id: true,
  username: true,
  fullName: true,
  mobile: true,
  isActive: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,

  role: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing =
      await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

    if (existing) {
      throw new ConflictException(
        "Username already exists.",
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      10,
    );

    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        fullName: dto.fullName,
        mobile: dto.mobile,
        roleId: dto.roleId,
        isActive: dto.isActive ?? true,
      },
      select: SELECT_FIELDS,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: SELECT_FIELDS,
      orderBy: {
        fullName: "asc",
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_FIELDS,
    });

    if (!user) {
      throw new NotFoundException(
        "User not found.",
      );
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
  ) {
    await this.findOne(id);

    if (
      id === currentUserId &&
      dto.isActive === false
    ) {
      throw new BadRequestException(
        "You cannot deactivate your own account.",
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        mobile: dto.mobile,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      select: SELECT_FIELDS,
    });
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
  ) {
    await this.findOne(id);

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      10,
    );

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true };
  }

  async remove(
    id: string,
    currentUserId: string,
  ) {
    await this.findOne(id);

    if (id === currentUserId) {
      throw new BadRequestException(
        "You cannot delete your own account.",
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
