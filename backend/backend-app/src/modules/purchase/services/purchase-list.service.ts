import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import { PurchaseListQueryDto } from "../dto/purchase-list-query.dto";

@Injectable()
export class PurchaseListService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getPurchaseList(
    query: PurchaseListQueryDto,
  ) {
    const {
      page = 1,
      pageSize = 50,

      search,
      supplierId,
      warehouseId,

      fromDate,
      toDate,

      status,

      sortBy = "billDate",
      sortOrder = "desc",
    } = query;

    const where: any = {};

    // =====================================
    // SEARCH
    // =====================================

    if (search?.trim()) {
      const searchValue =
        search.trim();

      where.OR = [
        {
          billNo: {
            contains: searchValue,
            mode: "insensitive",
          },
        },

        {
          invoiceNo: {
            contains: searchValue,
            mode: "insensitive",
          },
        },

        {
          supplier: {
            name: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // =====================================
    // SUPPLIER
    // =====================================

    if (supplierId) {
      where.supplierId =
        supplierId;
    }

    // =====================================
    // WAREHOUSE
    // =====================================

    if (warehouseId) {
      where.warehouseId =
        warehouseId;
    }

    // =====================================
    // STATUS
    // =====================================

    if (
      status &&
      status !== "ALL"
    ) {
      where.status = status;
    }

    // =====================================
    // DATE RANGE
    // =====================================

    if (fromDate || toDate) {
      where.billDate = {};

      if (fromDate) {
        const startDate =
          new Date(
            `${fromDate}T00:00:00`,
          );

        if (
          !Number.isNaN(
            startDate.getTime(),
          )
        ) {
          where.billDate.gte =
            startDate;
        }
      }

      if (toDate) {
        const endDate =
          new Date(
            `${toDate}T00:00:00`,
          );

        if (
          !Number.isNaN(
            endDate.getTime(),
          )
        ) {
          // Include the entire selected day.
          endDate.setDate(
            endDate.getDate() + 1,
          );

          where.billDate.lt =
            endDate;
        }
      }
    }

    // =====================================
    // SORT
    // =====================================

    const allowedSortFields = [
      "billDate",
      "billNo",
      "invoiceNo",
      "netAmount",
      "createdAt",
    ];

    const safeSortBy =
      allowedSortFields.includes(
        sortBy,
      )
        ? sortBy
        : "billDate";

    const safeSortOrder =
      sortOrder === "asc"
        ? "asc"
        : "desc";

    // =====================================
    // DATABASE QUERY
    // =====================================

    const [total, purchases] =
      await this.prisma.$transaction([
        this.prisma.purchaseBill.count({
          where,
        }),

        this.prisma.purchaseBill.findMany({
          where,

          include: {
            supplier: true,

            warehouse: true,

            items: true,
          },

          orderBy: {
            [safeSortBy]:
              safeSortOrder,
          },

          skip:
            (page - 1) *
            pageSize,

          take: pageSize,
        }),
      ]);

    // =====================================
    // RESPONSE
    // =====================================

    return {
      data: purchases.map(
        (purchase) => ({
          id: purchase.id,

          billNo:
            purchase.billNo,

          billDate:
            purchase.billDate,

          invoiceNo:
            purchase.invoiceNo,

          supplierId:
            purchase.supplierId,

          supplierName:
            purchase.supplier.name,

          warehouseId:
            purchase.warehouseId,

          warehouseName:
            purchase.warehouse.name,

          totalItems:
            purchase.items.length,

          totalAmount:
            purchase.netAmount,

          status:
            purchase.status,
        }),
      ),

      total,

      page,

      pageSize,
    };
  }
}