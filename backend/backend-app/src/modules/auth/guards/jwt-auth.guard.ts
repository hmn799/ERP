import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { AuthUser } from '../types/auth-user.type';

/**
 * Requires a valid Bearer token. Attaches the decoded
 * AuthUser payload to request.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
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

    if (!token) {
      throw new UnauthorizedException(
        'Login is required for this action.',
      );
    }

    try {
      request.user =
        await this.jwtService.verifyAsync<AuthUser>(
          token,
        );
    } catch {
      throw new UnauthorizedException(
        'Session expired or invalid. Please log in again.',
      );
    }

    return true;
  }
}

export function extractToken(request: {
  headers: Record<string, string | undefined>;
}) {
  const header = request.headers['authorization'];

  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }

  return header.slice('Bearer '.length).trim();
}
