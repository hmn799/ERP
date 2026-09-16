import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Core transaction-integrity tests.
 *
 * These run against a dedicated database (see .env.test / erp_db_test),
 * never the development database. Every write made here is scoped to
 * master data created in beforeAll and is safe to leave behind or wipe.
 */
describe('Core transactions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let warehouseId: string;
  let supplierId: string;
  let customerId: string;
  let itemId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('erp_db_test')) {
      throw new Error(
        'Refusing to run: DATABASE_URL must point at erp_db_test. ' +
          'Run tests with the erp_db_test connection string.',
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    server = app.getHttpServer();
    prisma = app.get(PrismaService);

    const suffix = Date.now().toString(36);

    const category = await prisma.category.create({
      data: { name: `Test Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Piece-${suffix}`, shortName: `PC${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `SUP-${suffix}`,
        name: `Test Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-${suffix}`,
        name: `Test Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });
    customerId = customer.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `ITEM-${suffix}`,
        name: `Test Item ${suffix}`,
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        baseUnitId: unit.id,
        purchaseUnitId: unit.id,
        saleUnitId: unit.id,
        conversionFactor: 1,
        mrp: 100,
        purchaseRate: 50,
      },
    });
    itemId = item.id;

    for (const [documentType, name] of [
      ['PB', 'Purchase Bill'],
      ['SB', 'Sales Bill'],
      ['PR', 'Purchase Return'],
      ['SR', 'Sales Return'],
    ] as const) {
      await prisma.documentSeries.upsert({
        where: { documentType },
        update: {},
        create: {
          documentType,
          name,
          prefix: documentType,
          suffix: null,
          padding: 6,
          currentNumber: 0,
          resetYearly: false,
          financialYear: null,
          isActive: true,
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  function purchasePayload(
    overrides: Partial<{
      qty: number;
      purchaseRate: number;
      mrp: number;
    }> = {},
  ) {
    return {
      billDate: new Date().toISOString(),
      supplierId,
      warehouseId,
      items: [
        {
          itemId,
          batchNo: 'BATCH-1',
          qty: overrides.qty ?? 10,
          purchaseRate: overrides.purchaseRate ?? 50,
          retailRate: 80,
          wholesaleRate: 70,
          distributorRate: 60,
          mrp: overrides.mrp ?? 100,
          discountPercent: 0,
          gstPercent: 18,
        },
      ],
    };
  }

  async function getStock(batchId: string) {
    const stock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_itemId_batchId: { warehouseId, itemId, batchId },
      },
    });
    return stock ? Number(stock.quantity) : 0;
  }

  /**
   * The purchase create endpoint only returns the bill header (no items),
   * unlike sales, which returns the full bill with items included. Fetch
   * the detail view to get the resolved batch id for each item.
   */
  async function createPurchase(payload: ReturnType<typeof purchasePayload>) {
    const created = await request(server)
      .post('/api/purchases')
      .send(payload)
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    return { header: created.body, detail: detail.body };
  }

  it('creates a purchase, generates a server-side bill number, and adds stock', async () => {
    const { header, detail } = await createPurchase(purchasePayload({ qty: 10 }));

    expect(header.billNo).toMatch(/^PB\d{6}$/);
    expect(detail.items).toHaveLength(1);

    const batchId = detail.items[0].batchId;
    expect(await getStock(batchId)).toBe(10);
  });

  it('rejects a purchase with an invalid item and leaves no partial data (atomicity)', async () => {
    const before = await prisma.purchaseBill.count();

    const payload = purchasePayload({ qty: 5 });
    payload.items.push({
      ...payload.items[0],
      itemId: 'non-existent-item-id',
      batchNo: 'BATCH-BAD',
    });

    await request(server).post('/api/purchases').send(payload).expect(500);

    const after = await prisma.purchaseBill.count();
    expect(after).toBe(before);
  });

  it('creates a sale that reduces stock and generates a server-side bill number', async () => {
    const { detail: purchaseDetail } = await createPurchase(
      purchasePayload({ qty: 20, purchaseRate: 55, mrp: 110 }),
    );

    const batchId = purchaseDetail.items[0].batchId;
    expect(await getStock(batchId)).toBe(20);

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId,
        items: [
          {
            itemId,
            batchId,
            qty: 6,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 566.4 }],
      })
      .expect(201);

    expect(saleRes.body.billNo).toMatch(/^SB\d{6}$/);
    expect(await getStock(batchId)).toBe(14);

    return { batchId, saleId: saleRes.body.id } as never;
  });

  it('rejects a sale that requests more than the available stock', async () => {
    const { detail: purchaseDetail } = await createPurchase(
      purchasePayload({ qty: 3, purchaseRate: 51, mrp: 101 }),
    );

    const batchId = purchaseDetail.items[0].batchId;
    expect(await getStock(batchId)).toBe(3);

    await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId,
            batchId,
            qty: 100,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 9440 }],
      })
      .expect(400);

    // Stock must be unchanged after the rejected sale.
    expect(await getStock(batchId)).toBe(3);
  });

  it('restores stock on a purchase return', async () => {
    const { header: purchaseHeader, detail: purchaseDetail } =
      await createPurchase(purchasePayload({ qty: 8, purchaseRate: 52, mrp: 102 }));

    const purchaseBillId = purchaseHeader.id;
    const item = purchaseDetail.items[0];
    expect(await getStock(item.batchId)).toBe(8);

    await request(server)
      .post('/api/purchase-returns')
      .send({
        returnDate: new Date().toISOString(),
        purchaseBillId,
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchId: item.batchId,
            qty: 3,
            purchaseRate: item.purchaseRate,
            gstPercent: item.gstPercent,
          },
        ],
      })
      .expect(201);

    expect(await getStock(item.batchId)).toBe(5);
  });

  it('restores stock on a sale return', async () => {
    const { detail: purchaseDetail } = await createPurchase(
      purchasePayload({ qty: 10, purchaseRate: 53, mrp: 103 }),
    );

    const batchId = purchaseDetail.items[0].batchId;

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId,
        items: [
          {
            itemId,
            batchId,
            qty: 4,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 377.6 }],
      })
      .expect(201);

    expect(await getStock(batchId)).toBe(6);

    const saleItem = saleRes.body.items[0];

    await request(server)
      .post('/api/sale-returns')
      .send({
        returnDate: new Date().toISOString(),
        salesBillId: saleRes.body.id,
        customerId,
        warehouseId,
        items: [
          {
            itemId,
            batchId,
            qty: 2,
            saleRate: saleItem.saleRate,
            gstPercent: saleItem.gstPercent,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 188.8 }],
      })
      .expect(201);

    expect(await getStock(batchId)).toBe(8);
  });

  it('never issues duplicate document numbers under concurrent purchase creation', async () => {
    const attempts = 8;

    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(server)
          .post('/api/purchases')
          .send(purchasePayload({ qty: 1, purchaseRate: 59, mrp: 119 })),
      ),
    );

    const billNos = results.map((res) => {
      expect(res.status).toBe(201);
      return res.body.billNo;
    });

    expect(new Set(billNos).size).toBe(attempts);
  });

  it('customer billing summary reports total sales, top items, and purchase history', async () => {
    const suffix = Date.now().toString(36);

    const customer = await prisma.customer.create({
      data: {
        customerCode: `SUMCUST-${suffix}`,
        name: `Summary Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });

    const purchaseRes = await request(server)
      .post('/api/purchases')
      .send(purchasePayload({ qty: 20, purchaseRate: 54, mrp: 104 }))
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${purchaseRes.body.id}`)
      .expect(200);

    const batchId = detail.body.items[0].batchId;

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId: customer.id,
        items: [
          {
            itemId,
            batchId,
            qty: 3,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 283.2 }],
      })
      .expect(201);

    const summary = await request(server)
      .get(`/api/reports/customer-billing-summary/${customer.id}`)
      .expect(200);

    expect(summary.body.billCount).toBe(1);
    expect(Number(summary.body.totalSales)).toBeCloseTo(
      Number(saleRes.body.netAmount),
      2,
    );
    expect(summary.body.topItems).toHaveLength(1);
    expect(summary.body.topItems[0].itemId).toBe(itemId);
    expect(summary.body.topItems[0].qty).toBe(3);
    expect(summary.body.purchaseHistory).toHaveLength(1);
    expect(summary.body.purchaseHistory[0].billNo).toBe(
      saleRes.body.billNo,
    );
  });

  it('accepts a batch expiry date on a purchase (regression: IsDateString + Date-typed field)', async () => {
    const payload = purchasePayload({ qty: 4, purchaseRate: 61, mrp: 121 });
    (payload.items[0] as any).expiryDate = '2027-12-31';

    const res = await request(server)
      .post('/api/purchases')
      .send(payload)
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${res.body.id}`)
      .expect(200);

    expect(detail.body.items[0].batch.expiryDate).toContain(
      '2027-12-31',
    );
  });
});
