import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";

const LIST_INCLUDE = {
  permissions: {
    include: { permission: true },
  },

  _count: {
    select: { users: true },
  },
} as const;

function toRoleResponse(
  role: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    permissions: {
      permission: { id: string; code: string; name: string };
    }[];
    _count: { users: number };
  },
) {
  return {
    id: role.id,
    name: role.name,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    userCount: role._count.users,
    permissions: role.permissions.map(
      (rp) => rp.permission,
    ),
  };
}

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: LIST_INCLUDE,
      orderBy: { name: "asc" },
    });

    return roles.map(toRoleResponse);
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });

    if (!role) {
      throw new NotFoundException("Role not found.");
    }

    return toRoleResponse(role);
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique(
      { where: { name: dto.name } },
    );

    if (existing) {
      throw new ConflictException(
        "A role with this name already exists.",
      );
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,

        permissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map(
                (permissionId) => ({ permissionId }),
              ),
            }
          : undefined,
      },
      include: LIST_INCLUDE,
    });

    return toRoleResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    const existing = await this.prisma.role.findUnique(
      { where: { name: dto.name } },
    );

    if (existing && existing.id !== id) {
      throw new ConflictException(
        "A role with this name already exists.",
      );
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: { name: dto.name },
      include: LIST_INCLUDE,
    });

    return toRoleResponse(role);
  }

  async updatePermissions(
    id: string,
    dto: UpdateRolePermissionsDto,
  ) {
    await this.findOne(id);

    const role = await this.prisma.$transaction(
      async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map(
              (permissionId) => ({
                roleId: id,
                permissionId,
              }),
            ),
          });
        }

        return tx.role.findUniqueOrThrow({
          where: { id },
          include: LIST_INCLUDE,
        });
      },
    );

    return toRoleResponse(role);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found.");
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete a role with ${role._count.users} user(s) assigned to it. Reassign them first.`,
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { success: true };
  }
}
