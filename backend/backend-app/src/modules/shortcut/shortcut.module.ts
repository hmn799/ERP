import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ShortcutController } from './shortcut.controller';
import { ShortcutService } from './shortcut.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShortcutController],
  providers: [ShortcutService],
})
export class ShortcutModule {}
