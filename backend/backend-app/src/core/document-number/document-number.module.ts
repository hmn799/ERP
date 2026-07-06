import { Module } from '@nestjs/common';

import { PrismaModule } from '../../modules/prisma/prisma.module';

import { DocumentNumberController } from './document-number.controller';
import { DocumentNumberService } from './document-number.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    DocumentNumberController,
  ],

  providers: [
    DocumentNumberService,
  ],

  exports: [
    DocumentNumberService,
  ],
})
export class DocumentNumberModule {}