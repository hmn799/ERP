import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Dashboard / sales-trend report tests.
 */
describe('Reports - dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let warehouseId: string;
  let supplierId: string;
  let itemId: string;

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
      data: { name: `Dash Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Dash GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Dash Piece-${suffix}`, shortName: `DP${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Dash Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `DSUP-${suffix}`,
        name: `Dash Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `DASH-${suffix}`,
        name: `Dash Item ${suffix}`,
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

  it('GET /reports/dashboard returns aggregate figures', async () => {
    const res = await request(server)
      .get('/api/reports/dashboard')
      .expect(200);

    expect(typeof res.body.totalSales).toBe('number');
    expect(typeof res.body.customerOutstanding).toBe(
      'number',
    );
    expect(Array.isArray(res.body.fastMovingItems)).toBe(
      true,
    );
  });

  it('GET /reports/sales-trend returns one row per day, including a real sale', async () => {
    const purchaseRes = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: 'BATCH-1',
            qty: 10,
            purchaseRate: 50,
            retailRate: 80,
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
      .get(`/api/purchases/${purchaseRes.body.id}`)
      .expect(200);

    const batchId = detail.body.items[0].batchId;

    const saleRes = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId,
            batchId,
            qty: 1,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 94.4 }],
      })
      .expect(201);

    const trend = await request(server)
      .get('/api/reports/sales-trend?days=7')
      .expect(200);

    expect(trend.body).toHaveLength(7);

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const todayRow = trend.body.find(
      (row: any) => row.date === today,
    );

    expect(todayRow).toBeTruthy();
    expect(todayRow.sales).toBeGreaterThanOrEqual(
      Number(saleRes.body.netAmount),
    );
  });

  it('GET /reports/sales-trend defaults to 14 days and clamps large values', async () => {
    const defaultTrend = await request(server)
      .get('/api/reports/sales-trend')
      .expect(200);

    expect(defaultTrend.body).toHaveLength(14);

    const clamped = await request(server)
      .get('/api/reports/sales-trend?days=9999')
      .expect(200);

    expect(clamped.body).toHaveLength(90);
  });
});
