import { Module } from '@nestjs/common';
import { PartyPriceService } from './party-price.service';
import { PartyPriceController } from './party-price.controller';

@Module({
  controllers: [PartyPriceController],
  providers: [PartyPriceService],
})
export class PartyPriceModule {}
