import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Read-only for now - just enough to populate a role
 * picker (e.g. shortcut role-eligibility). Full role
 * management (create/edit/permissions) is a separate,
 * larger admin feature.
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
