import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Analytics (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

  let warehouseId: string;
  let supplierId: string;
  let customerId: string;
  let categoryId: string;
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

    const adminLogin = await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;

    const suffix = Date.now().toString(36);

    const noPermRole = await prisma.role.upsert({
      where: { name: 'NoPermAnalyticsRole' },
      update: {},
      create: { name: 'NoPermAnalyticsRole' },
    });

    await prisma.user.upsert({
      where: { username: `analytics-noperm-${suffix}` },
      update: {},
      create: {
        username: `analytics-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `analytics-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const category = await prisma.category.create({
      data: { name: `Analytics Category ${suffix}` },
    });
    categoryId = category.id;

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Analytics-GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: {
        name: `Analytics-Piece-${suffix}`,
        shortName: `ANPC${suffix}`,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Analytics Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `ANSUP-${suffix}`,
        name: `Analytics Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `ANCUST-${suffix}`,
        name: `Analytics Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });
    customerId = customer.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `ANITEM-${suffix}`,
        name: `Analytics Item ${suffix}`,
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        baseUnitId: unit.id,
        purchaseUnitId: unit.id,
        saleUnitId: unit.id,
        conversionFactor: 1,
        mrp: 100,
        purchaseRate: 10,
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

  it('requires login and VIEW_PROFIT for every analytics endpoint', async () => {
    for (const path of [
      '/api/analytics/stock-velocity',
      '/api/analytics/reorder-recommendations',
      '/api/analytics/sales-forecast',
      '/api/analytics/category-performance',
      '/api/analytics/trend',
    ]) {
      await request(server).get(path).expect(401);
      await request(server)
        .get(path)
        .set('Authorization', `Bearer ${noPermToken}`)
        .expect(403);
      await request(server)
        .get(path)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    }
  });

  it('classifies an item with no sales as DEAD stock', async () => {
    await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `AN-DEAD-${Date.now()}`,
            qty: 5,
            purchaseRate: 10,
            retailRate: 20,
            wholesaleRate: 18,
            distributorRate: 16,
            mrp: 25,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    const res = await request(server)
      .get('/api/analytics/stock-velocity')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const row = res.body.find((r: any) => r.itemId === itemId);

    expect(row).toBeTruthy();
    expect(row.currentStock).toBe(5);
    expect(row.qtySoldLast90Days).toBe(0);
    expect(row.classification).toBe('DEAD');
  });

  it('reclassifies as FAST once sales outpace remaining stock, and recommends a reorder', async () => {
    const created = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `AN-FAST-${Date.now()}`,
            qty: 200,
            purchaseRate: 10,
            retailRate: 20,
            wholesaleRate: 18,
            distributorRate: 16,
            mrp: 25,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    const batchId = detail.body.items[0].batchId;

    await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId,
        items: [
          {
            itemId,
            batchId,
            qty: 195,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 20,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 4602 }],
      })
      .expect(201);

    const velocityRes = await request(server)
      .get('/api/analytics/stock-velocity')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Total across both batches created for this item: 5 + 200 - 195 = 10.
    const row = velocityRes.body.find(
      (r: any) => r.itemId === itemId,
    );

    expect(row.currentStock).toBe(10);
    expect(row.qtySoldLast90Days).toBe(195);
    expect(row.classification).toBe('FAST');

    const reorderRes = await request(server)
      .get('/api/analytics/reorder-recommendations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const reorderRow = reorderRes.body.find(
      (r: any) => r.itemId === itemId,
    );

    expect(reorderRow).toBeTruthy();
    expect(reorderRow.recommendedQty).toBeGreaterThan(0);
  }, 20000);

  it('aggregates category performance with real profit figures scoped to the test category', async () => {
    const res = await request(server)
      .get('/api/analytics/category-performance')
      .query({ days: 365 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const row = res.body.find(
      (r: any) => r.categoryId === categoryId,
    );

    expect(row).toBeTruthy();
    expect(row.itemCount).toBe(1);
    // 195 units sold at rate 20 = 3900 taxable-equivalent gross sale
    // value before GST split; the exact netAmount depends on GST calc,
    // so just assert the sign and rough shape rather than a brittle
    // exact figure.
    expect(row.salesValue).toBeGreaterThan(0);
    expect(row.costValue).toBe(1950); // 195 * purchaseRate(10)
    expect(row.profit).toBeCloseTo(
      row.salesValue - row.costValue,
      2,
    );
  });

  it('returns a well-formed sales forecast for the requested horizon', async () => {
    const res = await request(server)
      .get('/api/analytics/sales-forecast')
      .query({ days: 7, historyDays: 30 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.history).toHaveLength(30);
    expect(res.body.forecast).toHaveLength(7);

    for (const point of res.body.forecast) {
      expect(typeof point.date).toBe('string');
      expect(point.projected).toBeGreaterThanOrEqual(0);
    }

    expect(typeof res.body.projectedTotal).toBe('number');
  });

  it('returns a well-formed period-over-period trend comparison', async () => {
    const res = await request(server)
      .get('/api/analytics/trend')
      .query({ periodDays: 30 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.periodDays).toBe(30);
    expect(res.body.current).toHaveProperty('salesValue');
    expect(res.body.previous).toHaveProperty('salesValue');
    expect(res.body.growth).toHaveProperty('salesValue');
  });
});
