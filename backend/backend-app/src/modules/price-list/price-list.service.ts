import { Injectable } from '@nestjs/common';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Injectable()
export class PriceListService {
  create(createPriceListDto: CreatePriceListDto) {
    return 'This action adds a new priceList';
  }

  findAll() {
    return `This action returns all priceList`;
  }

  findOne(id: number) {
    return `This action returns a #${id} priceList`;
  }

  update(id: number, updatePriceListDto: UpdatePriceListDto) {
    return `This action updates a #${id} priceList`;
  }

  remove(id: number) {
    return `This action removes a #${id} priceList`;
  }
}
