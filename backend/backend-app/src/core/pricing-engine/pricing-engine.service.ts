import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../modules/prisma/prisma.service';

import { GetSellingPriceDto } from './dto/get-selling-price.dto';

import { PricingResult } from './interfaces/pricing-result.interface';

import { PriceSourceType } from './enums/price-source.enum';

@Injectable()
export class PricingEngineService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getSellingPrice(
    dto: GetSellingPriceDto,
  ): Promise<PricingResult> {

    //
    // STEP 1
    // PARTY PRICE
    //

    if (dto.customerId) {

      const partyPrice =
        await this.prisma.partyPrice.findFirst({

          where: {

            customerId: dto.customerId,

            itemId: dto.itemId,

            isActive: true,

          },

          orderBy: {
            createdAt: 'desc',
          },

        });

      if (partyPrice) {

        return {

          salePrice: partyPrice.salePrice,

          minimumPrice:
            partyPrice.minimumPrice,

          maximumDiscountPercent:
            partyPrice.maximumDiscountPercent,

          allowManualOverride:
            partyPrice.allowManualOverride,

          source:
            PriceSourceType.PARTY_PRICE,

        };

      }

    }

    //
    // STEP 2
    // ITEM PRICE
    //

    const itemPrice =
      await this.prisma.itemPrice.findFirst({

        where: {

          itemId: dto.itemId,

          isActive: true,

        },

        include: {

          priceList: true,

        },

        orderBy: {

          priceList: {

            priority: 'asc',

          },

        },

      });

    if (itemPrice) {

      return {

        salePrice:
          itemPrice.salePrice,

        minimumPrice:
          itemPrice.minimumPrice,

        maximumDiscountPercent:
          itemPrice.maximumDiscountPercent,

        allowManualOverride:
          itemPrice.allowManualOverride,

        source:
          PriceSourceType.ITEM_PRICE,

      };

    }

    //
    // NO PRICE FOUND
    //

    throw new NotFoundException(
      'No selling price found.',
    );

  }
}