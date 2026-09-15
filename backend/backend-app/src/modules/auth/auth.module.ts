import { Global, Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  imports: [
    PrismaModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    PermissionsGuard,
  ],

  exports: [
    JwtModule,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
