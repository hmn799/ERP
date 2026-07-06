import { PartialType } from '@nestjs/mapped-types';
import { CreatePartyPriceDto } from './create-party-price.dto';

export class UpdatePartyPriceDto extends PartialType(
  CreatePartyPriceDto,
) {}