import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Batch Barcodes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

  let itemId: string;
  let batchAId: string;
  let batchBId: string;

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
      where: { name: 'NoPermBatchBarcodeRole' },
      update: {},
      create: { name: 'NoPermBatchBarcodeRole' },
    });

    await prisma.user.upsert({
      where: { username: `batch-barcode-noperm-${suffix}` },
      update: {},
      create: {
        username: `batch-barcode-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `batch-barcode-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const category = await prisma.category.create({
      data: { name: `BC-Test-Category-${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `BC-Test-GST-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: {
        name: `BC-Test-Unit-${suffix}`,
        shortName: `bctu${suffix}`,
      },
    });

    const item = await prisma.item.create({
      data: {
        itemCode: `BC-TEST-ITEM-${suffix}`,
        name: `Barcode Test Item ${suffix}`,
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        baseUnitId: unit.id,
        purchaseUnitId: unit.id,
        saleUnitId: unit.id,
        mrp: 100,
        purchaseRate: 80,
      },
    });

    itemId = item.id;

    const batchA = await prisma.batch.create({
      data: {
        batchNo: `BC-TEST-BATCH-A-${suffix}`,
        itemId: item.id,
        purchaseRate: 80,
        retailRate: 100,
        wholesaleRate: 90,
        distributorRate: 85,
        mrp: 100,
        creationReason: 'NEW_ITEM',
      },
    });

    batchAId = batchA.id;

    const batchB = await prisma.batch.create({
      data: {
        batchNo: `BC-TEST-BATCH-B-${suffix}`,
        itemId: item.id,
        purchaseRate: 80,
        retailRate: 100,
        wholesaleRate: 90,
        distributorRate: 85,
        mrp: 100,
        creationReason: 'NEW_ITEM',
      },
    });

    batchBId = batchB.id;

    await prisma.batchBarcode.create({
      data: {
        batchId: batchB.id,
        barcode: `BC-TEST-EXISTING-${suffix}`,
        isPrimary: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires login and MANAGE_BATCH_BARCODES to mutate barcodes', async () => {
    await request(server)
      .post(`/api/batches/${batchAId}/barcodes`)
      .send({ barcode: 'X1' })
      .expect(401);

    await request(server)
      .post(`/api/batches/${batchAId}/barcodes`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .send({ barcode: 'X1' })
      .expect(403);
  });

  it('adds the first barcode as primary automatically', async () => {
    const res = await request(server)
      .post(`/api/batches/${batchAId}/barcodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ barcode: `BC-TEST-PRIMARY-${batchAId}` })
      .expect(201);

    expect(res.body.isPrimary).toBe(true);
  });

  it('adds a second barcode as non-primary', async () => {
    const res = await request(server)
      .post(`/api/batches/${batchAId}/barcodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ barcode: `BC-TEST-ALT-${batchAId}` })
      .expect(201);

    expect(res.body.isPrimary).toBe(false);

    const batch = await request(server)
      .get(`/api/batches/${batchAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(batch.body.barcodes).toHaveLength(2);
  });

  it('rejects a barcode already used by another batch', async () => {
    const existing = await prisma.batchBarcode.findFirst({
      where: { batchId: batchBId },
    });

    await request(server)
      .post(`/api/batches/${batchAId}/barcodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ barcode: existing!.barcode })
      .expect(409);
  });

  it('returns 404 for a non-existent batch', async () => {
    await request(server)
      .post('/api/batches/does-not-exist/barcodes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ barcode: 'whatever' })
      .expect(404);
  });

  it('lets the operator change which barcode is primary', async () => {
    const batch = await request(server)
      .get(`/api/batches/${batchAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const alt = batch.body.barcodes.find((b: any) => !b.isPrimary);

    await request(server)
      .patch(`/api/batches/${batchAId}/barcodes/${alt.id}/primary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const after = await request(server)
      .get(`/api/batches/${batchAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const primaries = after.body.barcodes.filter(
      (b: any) => b.isPrimary,
    );
    expect(primaries).toHaveLength(1);
    expect(primaries[0].id).toBe(alt.id);
  });

  it('promotes the oldest remaining barcode when the primary is removed', async () => {
    const batch = await request(server)
      .get(`/api/batches/${batchAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const primary = batch.body.barcodes.find((b: any) => b.isPrimary);
    const other = batch.body.barcodes.find(
      (b: any) => b.id !== primary.id,
    );

    await request(server)
      .delete(`/api/batches/${batchAId}/barcodes/${primary.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const after = await request(server)
      .get(`/api/batches/${batchAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(after.body.barcodes).toHaveLength(1);
    expect(after.body.barcodes[0].id).toBe(other.id);
    expect(after.body.barcodes[0].isPrimary).toBe(true);
  });

  it('surfaces every batch barcode for an item via the read-only item summary', async () => {
    const res = await request(server)
      .get(`/api/items/${itemId}/barcodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const batchIds = res.body.batches.map((b: any) => b.batchId);
    expect(batchIds).toEqual(
      expect.arrayContaining([batchAId, batchBId]),
    );

    const batchB = res.body.batches.find(
      (b: any) => b.batchId === batchBId,
    );
    expect(batchB.barcodes).toHaveLength(1);
    expect(batchB.barcodes[0].isPrimary).toBe(true);
  });
});
