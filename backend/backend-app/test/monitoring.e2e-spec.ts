import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Monitoring (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

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

    const adminLogin = await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;

    const suffix = Date.now().toString(36);

    const noPermRole = await prisma.role.upsert({
      where: { name: 'NoPermMonitoringRole' },
      update: {},
      create: { name: 'NoPermMonitoringRole' },
    });

    await prisma.user.upsert({
      where: { username: `monitoring-noperm-${suffix}` },
      update: {},
      create: {
        username: `monitoring-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `monitoring-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const category = await prisma.category.create({
      data: { name: `Monitor Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Monitor-GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Monitor-Piece-${suffix}`, shortName: `MPC${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Monitor Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `MONSUP-${suffix}`,
        name: `Monitor Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `MONITEM-${suffix}`,
        name: `Monitor Item ${suffix}`,
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

  it('requires login and VIEW_MONITORING for every monitoring endpoint', async () => {
    await request(server).get('/api/monitoring/alerts').expect(401);
    await request(server)
      .get('/api/monitoring/alerts')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);
    await request(server)
      .get('/api/monitoring/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(server)
      .get('/api/monitoring/summary')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);

    await request(server)
      .post('/api/monitoring/reconciliation/run')
      .expect(401);
  });

  it('records a TRANSACTION_ERROR alert when an unhandled 500 occurs, but not for ordinary 4xx rejections', async () => {
    const payload = {
      billDate: new Date().toISOString(),
      supplierId,
      warehouseId,
      items: [
        {
          itemId: 'does-not-exist',
          batchNo: 'MON-BAD-BATCH',
          qty: 1,
          purchaseRate: 10,
          retailRate: 20,
          wholesaleRate: 18,
          distributorRate: 16,
          mrp: 25,
          discountPercent: 0,
          gstPercent: 18,
        },
      ],
    };

    await request(server)
      .post('/api/purchases')
      .send(payload)
      .expect(500);

    // An ordinary permission rejection (403) must not be alerted on.
    await request(server)
      .get('/api/monitoring/alerts')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);

    const alertsRes = await request(server)
      .get('/api/monitoring/alerts')
      .query({ category: 'TRANSACTION_ERROR' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = alertsRes.body.items.find((a: any) =>
      a.details?.url?.includes('/api/purchases'),
    );

    expect(match).toBeTruthy();
    expect(match.severity).toBe('CRITICAL');
  });

  it('records a SLOW_QUERY alert when a report exceeds the configured threshold', async () => {
    const original = process.env.SLOW_QUERY_THRESHOLD_MS;
    process.env.SLOW_QUERY_THRESHOLD_MS = '0';

    try {
      await request(server)
        .get('/api/reports/dashboard')
        .expect(200);
    } finally {
      process.env.SLOW_QUERY_THRESHOLD_MS = original;
    }

    const alertsRes = await request(server)
      .get('/api/monitoring/alerts')
      .query({ category: 'SLOW_QUERY' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = alertsRes.body.items.find((a: any) =>
      a.details?.url?.includes('/api/reports/dashboard'),
    );

    expect(match).toBeTruthy();
  });

  it('finds and alerts on a genuine stock mismatch, then lets it be acknowledged', async () => {
    const created = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `MON-BATCH-${Date.now()}`,
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
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    const batchId = detail.body.items[0].batchId;

    // Deliberately corrupt the warehouse stock so it no longer
    // matches the stock ledger's net movement for this batch.
    await prisma.warehouseStock.updateMany({
      where: { warehouseId, itemId, batchId },
      data: { quantity: 999 },
    });

    const drillRes = await request(server)
      .post('/api/monitoring/reconciliation/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const mismatch = drillRes.body.exceptions.find(
      (e: any) =>
        e.type === 'STOCK_MISMATCH' &&
        e.details.itemId === itemId &&
        e.details.batchId === batchId,
    );

    expect(mismatch).toBeTruthy();
    expect(mismatch.details.warehouseStockQty).toBe(999);
    expect(mismatch.details.stockLedgerNet).toBe(10);

    const alertsRes = await request(server)
      .get('/api/monitoring/alerts')
      .query({ category: 'RECONCILIATION_EXCEPTION' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const alert = alertsRes.body.items.find(
      (a: any) => a.details?.batchId === batchId,
    );

    expect(alert).toBeTruthy();
    expect(alert.acknowledgedAt).toBeNull();

    const ackRes = await request(server)
      .post(`/api/monitoring/alerts/${alert.id}/acknowledge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(ackRes.body.acknowledgedAt).toBeTruthy();
    expect(ackRes.body.acknowledgedByName).toBeTruthy();

    // Restore correct stock so later runs of this check stay clean.
    await prisma.warehouseStock.updateMany({
      where: { warehouseId, itemId, batchId },
      data: { quantity: 10 },
    });
  }, 20000);
});
