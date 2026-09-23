import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';
import { LedgerModule } from '../ledger/ledger.module';

import { AdjustmentNoteController } from './adjustment-note.controller';
import { AdjustmentNoteService } from './adjustment-note.service';

@Module({
  imports: [
    PrismaModule,
    DocumentNumberModule,
    LedgerModule,
  ],

  controllers: [
    AdjustmentNoteController,
  ],

  providers: [
    AdjustmentNoteService,
  ],

  exports: [
    AdjustmentNoteService,
  ],
})
export class AdjustmentNoteModule {}
