import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AuthUser } from '../types/auth-user.type';

/**
 * Must run after JwtAuthGuard, which populates
 * request.user. Checks the user's permissions against
 * whatever @RequirePermissions(...) declared on the
 * route.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest();

    const user: AuthUser | undefined = request.user;

    const hasAll = required.every((permission) =>
      user?.permissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `This action requires permission: ${required.join(', ')}.`,
      );
    }

    return true;
  }
}
