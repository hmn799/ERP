import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UpdateShortcutDto } from './dto/update-shortcut.dto';
import { SetRoleShortcutDto } from './dto/set-role-shortcut.dto';
import { CreateShortcutDto } from './dto/create-shortcut.dto';

/**
 * Normalizes a key combination string so "ctrl+d",
 * "Ctrl+D", and "CTRL + D" all compare equal for conflict
 * detection - order-independent on the modifiers, but the
 * final key keeps its own casing position.
 */
export function normalizeKey(key: string): string {
  const parts = key
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  const modifierOrder = ['Ctrl', 'Alt', 'Shift'];

  const modifiers = parts
    .slice(0, -1)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .filter((part) => modifierOrder.includes(part))
    .sort(
      (a, b) =>
        modifierOrder.indexOf(a) -
        modifierOrder.indexOf(b),
    );

  const mainKey = parts[parts.length - 1].toUpperCase();

  return [...modifiers, mainKey].join('+');
}

@Injectable()
export class ShortcutService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.shortcut.findMany({
      include: {
        roleOverrides: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { label: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const shortcut =
      await this.prisma.shortcut.findUnique({
        where: { id },
        include: {
          roleOverrides: {
            include: {
              role: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

    if (!shortcut) {
      throw new NotFoundException(
        'Shortcut not found.',
      );
    }

    return shortcut;
  }

  /*
   * A user-created shortcut is always a NAVIGATE one - jump to
   * `targetPath` - since that's the only action generic enough
   * for a settings screen to wire up without matching frontend
   * code elsewhere. actionCode is internal (never shown to the
   * user - the label is) so a random one is fine.
   */
  async create(dto: CreateShortcutDto) {
    const normalized = normalizeKey(dto.key);

    if (!normalized) {
      throw new BadRequestException(
        'Key combination cannot be empty.',
      );
    }

    const conflict = await this.prisma.shortcut.findFirst({
      where: {
        isEnabled: true,
        currentKey: normalized,
      },
    });

    if (conflict) {
      throw new ConflictException(
        `"${normalized}" is already assigned to "${conflict.label}".`,
      );
    }

    return this.prisma.shortcut.create({
      data: {
        actionCode: `NAV_${randomUUID()}`,
        label: dto.label,
        category: dto.category || 'Navigation',
        defaultKey: normalized,
        currentKey: normalized,
        isEnabled: true,
        actionType: 'NAVIGATE',
        targetPath: dto.targetPath,
      },
      include: {
        roleOverrides: {
          include: {
            role: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (existing.actionType !== 'NAVIGATE') {
      throw new BadRequestException(
        'Only shortcuts created from this screen can be deleted.',
      );
    }

    await this.prisma.shortcut.delete({ where: { id } });

    return { success: true };
  }

  async update(id: string, dto: UpdateShortcutDto) {
    const existing = await this.findOne(id);

    let currentKey = existing.currentKey;

    if (dto.currentKey !== undefined) {
      const normalized = normalizeKey(
        dto.currentKey,
      );

      if (!normalized) {
        throw new BadRequestException(
          'Key combination cannot be empty.',
        );
      }

      const conflict =
        await this.prisma.shortcut.findFirst({
          where: {
            id: { not: id },
            isEnabled: true,
            currentKey: normalized,
          },
        });

      if (
        conflict &&
        (dto.isEnabled ?? existing.isEnabled)
      ) {
        throw new ConflictException(
          `"${normalized}" is already assigned to "${conflict.label}".`,
        );
      }

      currentKey = normalized;
    }

    return this.prisma.shortcut.update({
      where: { id },
      data: {
        currentKey,
        isEnabled:
          dto.isEnabled ?? existing.isEnabled,
      },
    });
  }

  async resetToDefault(id: string) {
    const existing = await this.findOne(id);

    const conflict =
      await this.prisma.shortcut.findFirst({
        where: {
          id: { not: id },
          isEnabled: true,
          currentKey: existing.defaultKey,
        },
      });

    if (conflict) {
      throw new ConflictException(
        `Default key "${existing.defaultKey}" is already assigned to "${conflict.label}".`,
      );
    }

    return this.prisma.shortcut.update({
      where: { id },
      data: { currentKey: existing.defaultKey },
    });
  }

  async setRoleOverride(
    shortcutId: string,
    roleId: string,
    dto: SetRoleShortcutDto,
  ) {
    await this.findOne(shortcutId);

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return this.prisma.roleShortcut.upsert({
      where: {
        roleId_shortcutId: { roleId, shortcutId },
      },
      update: { isEnabled: dto.isEnabled },
      create: {
        roleId,
        shortcutId,
        isEnabled: dto.isEnabled,
      },
    });
  }

  async removeRoleOverride(
    shortcutId: string,
    roleId: string,
  ) {
    await this.prisma.roleShortcut
      .delete({
        where: {
          roleId_shortcutId: { roleId, shortcutId },
        },
      })
      .catch(() => null);

    return { success: true };
  }

  /*
   * =====================================================
   * EFFECTIVE SHORTCUTS FOR A ROLE
   *
   * Global Shortcut settings, with any RoleShortcut
   * override applied on top (a role-level disable wins
   * even if the shortcut is globally enabled).
   * =====================================================
   */

  async getEffectiveForRole(roleId: string) {
    const shortcuts =
      await this.prisma.shortcut.findMany({
        include: {
          roleOverrides: {
            where: { roleId },
          },
        },
        orderBy: [
          { category: 'asc' },
          { label: 'asc' },
        ],
      });

    return shortcuts.map((shortcut) => {
      const override = shortcut.roleOverrides[0];

      return {
        actionCode: shortcut.actionCode,
        label: shortcut.label,
        category: shortcut.category,
        key: shortcut.currentKey,
        actionType: shortcut.actionType,
        targetPath: shortcut.targetPath,
        enabled:
          shortcut.isEnabled &&
          (override ? override.isEnabled : true),
      };
    });
  }
}
