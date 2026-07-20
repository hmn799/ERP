import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';

import { BatchBarcodeService } from './services/batch-barcode.service';
import { BatchCreateService } from './services/batch-create.service';
import { BatchSearchService } from './services/batch-search.service';
import { BatchResolveService } from './services/batch-resolve.service';

@Module({
  imports: [
    PrismaModule,
    DocumentNumberModule,
  ],

  controllers: [
    BatchController,
  ],

  providers: [
    BatchService,
    BatchBarcodeService,
    BatchCreateService,
    BatchSearchService,
    BatchResolveService,
  ],

  exports: [
    BatchService,
    BatchBarcodeService,
    BatchCreateService,
     BatchSearchService,
     BatchResolveService,
  ],
})
export class BatchModule {}