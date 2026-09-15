import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Auth + permission enforcement tests.
 *
 * Runs against erp_db_test, same guard as the other e2e suites.
 * Relies on the seeded "admin" user (prisma/seed.ts) having every
 * permission, and a freshly-created "no permission" user for the
 * negative cases.
 */
describe('Auth + permissions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let warehouseId: string;
  let supplierId: string;
  let adminToken: string;
  let noPermToken: string;

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
      data: { name: `Auth Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `Auth GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: { name: `Auth Piece-${suffix}`, shortName: `AP${suffix}` },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `Auth Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `ASUP-${suffix}`,
        name: `Auth Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    (globalThis as any).__authTestFixtures = {
      category,
      gstSlab,
      unit,
      suffix,
    };

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

    // Admin token (seeded user has every permission).
    const adminLogin = await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;

    // A role and user with no permissions, for the negative cases.
    const noPermRole = await prisma.role.upsert({
      where: { name: 'NoPermTestRole' },
      update: {},
      create: { name: 'NoPermTestRole' },
    });

    await prisma.user.upsert({
      where: { username: `noperm-${suffix}` },
      update: {},
      create: {
        username: `noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createItem(code: string) {
    const { category, gstSlab, unit } = (globalThis as any)
      .__authTestFixtures;

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

  async function purchase(itemId: string, qty: number) {
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
      .get(`/api/purchases/${res.body.id}`)
      .expect(200);

    return { purchaseBillId: res.body.id, batchId: detail.body.items[0].batchId as string };
  }

  it('rejects login with a wrong password', async () => {
    await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong-password' })
      .expect(401);
  });

  it('logs in and returns a token with the user\'s permissions', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.permissions).toEqual(
      expect.arrayContaining(['CHANGE_RATE', 'APPLY_DISCOUNT']),
    );
  });

  it('rejects a manually overridden sale rate with no token', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`RATE-${suffix}`);
    const { batchId } = await purchase(item.id, 10);

    await request(server)
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
            saleRate: 999, // does not match the batch's retail rate
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 1178.82 }],
      })
      .expect(403);
  });

  it('rejects a manually overridden sale rate from a user without CHANGE_RATE', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`RATE2-${suffix}`);
    const { batchId } = await purchase(item.id, 10);

    await request(server)
      .post('/api/sales')
      .set('Authorization', `Bearer ${noPermToken}`)
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
            saleRate: 999,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 1178.82 }],
      })
      .expect(403);
  });

  it('allows a manually overridden sale rate from an authorized user', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`RATE3-${suffix}`);
    const { batchId } = await purchase(item.id, 10);

    const res = await request(server)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
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
            saleRate: 999,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 1178.82 }],
      })
      .expect(201);

    expect(Number(res.body.items[0].saleRate)).toBe(999);
  });

  it('rejects a manual item discount with no token, allows it for an authorized user', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`DISC-${suffix}`);
    const { batchId } = await purchase(item.id, 10);

    await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: item.id,
            batchId,
            qty: 1,
            discountPercent: 5,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 89.68 }],
      })
      .expect(403);

    const item2 = await createItem(`DISC2-${suffix}`);
    const { batchId: batchId2 } = await purchase(item2.id, 10);

    await request(server)
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        items: [
          {
            itemId: item2.id,
            batchId: batchId2,
            qty: 1,
            discountPercent: 5,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 89.68 }],
      })
      .expect(201);
  });

  it('requires login for purchase cancellation, then requires DELETE_PURCHASE', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`CANCEL-${suffix}`);
    const { purchaseBillId } = await purchase(item.id, 10);

    await request(server)
      .post(`/api/purchases/${purchaseBillId}/cancel`)
      .expect(401);

    await request(server)
      .post(`/api/purchases/${purchaseBillId}/cancel`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);

    await request(server)
      .post(`/api/purchases/${purchaseBillId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  it('requires CHANGE_RATE to save a party-item price override', async () => {
    const suffix = Date.now().toString(36);
    const item = await createItem(`PP-${suffix}`);

    const customer = await prisma.customer.create({
      data: {
        customerCode: `PPCUST-${suffix}`,
        name: `Party Price Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });

    await request(server)
      .post('/api/party-price')
      .send({
        customerId: customer.id,
        itemId: item.id,
        salePrice: 75,
      })
      .expect(401);

    await request(server)
      .post('/api/party-price')
      .set('Authorization', `Bearer ${noPermToken}`)
      .send({
        customerId: customer.id,
        itemId: item.id,
        salePrice: 75,
      })
      .expect(403);

    await request(server)
      .post('/api/party-price')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer.id,
        itemId: item.id,
        salePrice: 75,
      })
      .expect(201);
  });
});
