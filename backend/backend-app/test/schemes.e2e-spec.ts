import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Scheme engine tests (QUANTITY / FREE_ITEM / DISCOUNT).
 *
 * Runs against erp_db_test, same guard as transactions.e2e-spec.ts.
 */
describe('Scheme engine (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let warehouseId: string;
  let supplierId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('erp_db_test')) {
      throw new Error(
        'Refusing to run: DATABASE_URL must point at erp_db_test.',
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
      data: { name: `Scheme Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Scheme GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Scheme Piece-${suffix}`, shortName: `SP${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Scheme Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `SSUP-${suffix}`,
        name: `Scheme Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    for (const [documentType, name] of [
      ['PB', 'Purchase Bill'],
      ['SB', 'Sales Bill'],
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

    (globalThis as any).__schemeTestFixtures = {
      category,
      gstSlab,
      unit,
      suffix,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  async function createItem(code: string) {
    const { category, gstSlab, unit } = (globalThis as any)
      .__schemeTestFixtures;

    return prisma.item.create({
      data: {
        itemCode: code,
        name: code,
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
  }

  async function purchase(
    itemId: string,
    qty: number,
    retailRate = 80,
  ) {
    const res = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: 'BATCH-1',
            qty,
            purchaseRate: 50,
            retailRate,
            wholesaleRate: 70,
            distributorRate: 60,
            mrp: 100,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${res.body.id}`)
      .expect(200);

    return detail.body.items[0].batchId as string;
  }

  async function getStock(itemId: string, batchId: string) {
    const stock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_itemId_batchId: { warehouseId, itemId, batchId },
      },
    });
    return stock ? Number(stock.quantity) : 0;
  }

  it('QUANTITY scheme (10+1): adds free qty on top, bills only the paid portion', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`QTY-${suffix}`);
    const batchId = await purchase(item.id, 50);

    await request(server)
      .post('/api/schemes')
      .send({
        name: '10+1',
        schemeType: 'QUANTITY',
        itemId: item.id,
        buyQty: 10,
        freeQty: 1,
      })
      .expect(201);

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: item.id,
            batchId,
            qty: 10,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 944 }],
      })
      .expect(201);

    const line = saleRes.body.items[0];

    expect(Number(line.qty)).toBe(11);
    expect(Number(line.freeQty)).toBe(1);
    expect(line.schemeId).toBeTruthy();

    // Billable qty is 10 (paid), so taxable = 10 * 80 = 800.
    expect(Number(line.taxableAmount)).toBeCloseTo(800, 2);

    // Stock must be reduced by the full 11 (10 paid + 1 free).
    expect(await getStock(item.id, batchId)).toBe(39);
  });

  it('FREE_ITEM scheme: appends a free line for a different item, zero value, full stock deduction', async () => {
    const suffix = Date.now().toString(36);
    const trigger = await createItem(`TRG-${suffix}`);
    const freebie = await createItem(`FREE-${suffix}`);

    const triggerBatchId = await purchase(trigger.id, 20);
    const freebieBatchId = await purchase(freebie.id, 20);

    await request(server)
      .post('/api/schemes')
      .send({
        name: 'Buy trigger get freebie',
        schemeType: 'FREE_ITEM',
        itemId: trigger.id,
        buyQty: 5,
        freeQty: 2,
        freeItemId: freebie.id,
      })
      .expect(201);

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: trigger.id,
            batchId: triggerBatchId,
            qty: 5,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 472 }],
      })
      .expect(201);

    expect(saleRes.body.items).toHaveLength(2);

    const freeLine = saleRes.body.items.find(
      (line: any) => line.itemId === freebie.id,
    );

    expect(freeLine).toBeTruthy();
    expect(Number(freeLine.qty)).toBe(2);
    expect(Number(freeLine.freeQty)).toBe(2);
    expect(Number(freeLine.netAmount)).toBe(0);
    expect(freeLine.batchId).toBe(freebieBatchId);

    expect(await getStock(freebie.id, freebieBatchId)).toBe(18);
    expect(await getStock(trigger.id, triggerBatchId)).toBe(15);
  });

  it('DISCOUNT scheme: stacks an automatic percentage on top of the submitted discount', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`DISC-${suffix}`);
    const batchId = await purchase(item.id, 20, 100);

    await request(server)
      .post('/api/schemes')
      .send({
        name: '10% off',
        schemeType: 'DISCOUNT',
        itemId: item.id,
        discountPercent: 10,
      })
      .expect(201);

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: item.id,
            batchId,
            qty: 1,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 100,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 106.2 }],
      })
      .expect(201);

    const line = saleRes.body.items[0];

    // gross 100, 10% scheme discount -> taxable 90.
    expect(Number(line.taxableAmount)).toBeCloseTo(90, 2);
  });

  it('preview computes scheme effects without persisting anything', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`PREV-${suffix}`);
    const batchId = await purchase(item.id, 30);

    await request(server)
      .post('/api/schemes')
      .send({
        name: 'Preview 10+1',
        schemeType: 'QUANTITY',
        itemId: item.id,
        buyQty: 10,
        freeQty: 1,
      })
      .expect(201);

    const billsBefore = await prisma.salesBill.count();
    const stockBefore = await getStock(item.id, batchId);

    const previewRes = await request(server)
      .post('/api/sales/preview')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: item.id,
            batchId,
            qty: 10,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
      })
      .expect(201);

    const line = previewRes.body.items[0];
    expect(Number(line.qty)).toBe(11);
    expect(Number(line.freeQty)).toBe(1);

    expect(await prisma.salesBill.count()).toBe(billsBefore);
    expect(await getStock(item.id, batchId)).toBe(stockBefore);
  });
});
