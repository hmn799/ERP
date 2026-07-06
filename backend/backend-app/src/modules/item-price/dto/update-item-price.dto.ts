import { PartialType } from '@nestjs/mapped-types';
import { CreateItemPriceDto } from './create-item-price.dto';

export class UpdateItemPriceDto extends PartialType(CreateItemPriceDto) {}