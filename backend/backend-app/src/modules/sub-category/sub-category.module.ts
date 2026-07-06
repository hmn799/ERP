import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SubCategoryController } from './sub-category.controller';
import { SubCategoryService } from './sub-category.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
})
export class SubCategoryModule {}