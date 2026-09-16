import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Audit log (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

  let warehouseId: string;
  let supplierId: string;
  let customerId: string;
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
      where: { name: 'NoPermAuditRole' },
      update: {},
      create: { name: 'NoPermAuditRole' },
    });

    await prisma.user.upsert({
      where: { username: `audit-noperm-${suffix}` },
      update: {},
      create: {
        username: `audit-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `audit-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const category = await prisma.category.create({
      data: { name: `Audit Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Audit-GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Audit-Piece-${suffix}`, shortName: `APC${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Audit Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `AUDSUP-${suffix}`,
        name: `Audit Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `AUDCUST-${suffix}`,
        name: `Audit Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });
    customerId = customer.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `AUDITEM-${suffix}`,
        name: `Audit Item ${suffix}`,
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

  async function createPurchase(qty = 10) {
    const created = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `AUDIT-BATCH-${Date.now()}`,
            qty,
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

    return { header: created.body, detail: detail.body };
  }

  it('requires login and VIEW_AUDIT_LOG to read the audit log', async () => {
    await request(server).get('/api/audit-log').expect(401);

    await request(server)
      .get('/api/audit-log')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);

    await request(server)
      .get('/api/audit-log')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('records a RATE_OVERRIDE event when a sale uses a manual rate override', async () => {
    const { detail } = await createPurchase(20);
    const batchId = detail.items[0].batchId;

    const saleRes = await request(server)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId,
        items: [
          {
            itemId,
            batchId,
            qty: 2,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 95,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 224.2 }],
      })
      .expect(201);

    const auditRes = await request(server)
      .get('/api/audit-log')
      .query({ action: 'RATE_OVERRIDE', entityType: 'SalesBill' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = auditRes.body.items.find(
      (row: any) => row.entityId === saleRes.body.id,
    );

    expect(match).toBeTruthy();
    expect(match.actorName).toBeTruthy();
    expect(match.details.items[0].saleRate).toBe(95);
  });

  it('records a DISCOUNT_APPLIED event when a manual discount is used', async () => {
    const { detail } = await createPurchase(20);
    const batchId = detail.items[0].batchId;

    const saleRes = await request(server)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId,
        items: [
          {
            itemId,
            batchId,
            qty: 2,
            discountPercent: 10,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 169.92 }],
      })
      .expect(201);

    const auditRes = await request(server)
      .get('/api/audit-log')
      .query({ action: 'DISCOUNT_APPLIED', entityType: 'SalesBill' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = auditRes.body.items.find(
      (row: any) => row.entityId === saleRes.body.id,
    );

    expect(match).toBeTruthy();
    expect(match.details.itemDiscounts[0].discountPercent).toBe(10);
  });

  it('records a PARTY_PRICE_SET event when a party-item price is created', async () => {
    const res = await request(server)
      .post('/api/party-price')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId,
        itemId,
        salePrice: 88,
      })
      .expect(201);

    const auditRes = await request(server)
      .get('/api/audit-log')
      .query({ action: 'PARTY_PRICE_SET', entityType: 'PartyPrice' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = auditRes.body.items.find(
      (row: any) => row.entityId === res.body.id,
    );

    expect(match).toBeTruthy();
    expect(Number(match.details.salePrice)).toBe(88);
  });

  it('records a PURCHASE_CANCELLED event with the actor who cancelled it', async () => {
    const { header } = await createPurchase(5);

    await request(server)
      .post(`/api/purchases/${header.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const auditRes = await request(server)
      .get('/api/audit-log')
      .query({ action: 'PURCHASE_CANCELLED', entityType: 'PurchaseBill' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const match = auditRes.body.items.find(
      (row: any) => row.entityId === header.id,
    );

    expect(match).toBeTruthy();
    expect(match.details.billNo).toBe(header.billNo);
    expect(match.actorName).toBeTruthy();
  });
});
