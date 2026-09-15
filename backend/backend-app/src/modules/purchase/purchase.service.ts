import {
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { PurchaseListQueryDto } from "./dto/purchase-list-query.dto";

import { PurchaseSaveService } from "./services/purchase-save.service";
import { PurchaseEditService } from "./services/purchase-edit.service";
import { PurchaseListService } from "./services/purchase-list.service";
import { PurchaseCancellationService } from "./services/purchase-cancellation.service";

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly purchaseSaveService:
      PurchaseSaveService,

    private readonly purchaseEditService:
      PurchaseEditService,

    private readonly purchaseListService:
      PurchaseListService,

    private readonly purchaseCancellationService:
      PurchaseCancellationService,
  ) {}

  async create(
    dto: CreatePurchaseDto,
  ) {
    return this.prisma.$transaction(
      (tx) =>
        this.purchaseSaveService.savePurchase(
          dto,
          undefined,
          tx,
        ),
    );
  }

  async update(
    id: string,
    dto: CreatePurchaseDto,
  ) {
    return this.purchaseEditService.editPurchase(
      id,
      dto,
    );
  }

  async cancel(
    id: string,
  ) {
    return this.purchaseCancellationService.cancelPurchase(
      id,
    );
  }

  async findAll(
    query: PurchaseListQueryDto,
  ) {
    return this.purchaseListService.getPurchaseList(
      query,
    );
  }

  async findOne(
    id: string,
  ) {
    return this.prisma.purchaseBill.findUnique({
      where: {
        id,
      },

      include: {
        supplier: true,

        warehouse: true,

        items: {
          include: {
            item: true,

            batch: true,
          },
        },
      },
    });
  }
}