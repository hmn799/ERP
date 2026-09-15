import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { AuthUser } from '../types/auth-user.type';
import { extractToken } from './jwt-auth.guard';

/**
 * Attaches request.user when a valid Bearer token is
 * present, but never blocks the request - used on
 * endpoints that are open to everyone but behave
 * differently (or restrict specific fields) for a
 * logged-in user with the right permission.
 */
@Injectable()
export class OptionalJwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest();

    const token = extractToken(request);

    if (token) {
      try {
        request.user =
          await this.jwtService.verifyAsync<AuthUser>(
            token,
          );
      } catch {
        request.user = undefined;
      }
    }

    return true;
  }
}
