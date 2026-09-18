import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { AccountGroupController } from './account-group.controller';
import { AccountGroupService } from './account-group.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    AccountGroupController,
  ],

  providers: [
    AccountGroupService,
  ],
})
export class AccountGroupModule {}
