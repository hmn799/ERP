import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Purchase-entry GST inclusive/exclusive tax mode.
 *
 * The invariant under test: whichever way the rate was entered, the
 * *stored* purchaseRate (on the line item and on the batch, which is
 * the cost basis every report/analytic reads) is always the
 * tax-exclusive figure - inclusive is purely an input convenience,
 * converted once at save time.
 */
describe('Purchase tax mode (inclusive/exclusive) (e2e)', () => {
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
      data: { name: `TaxMode Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `TaxMode-GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: {
        name: `TaxMode-Piece-${suffix}`,
        shortName: `TMPC${suffix}`,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `TaxMode Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `TMSUP-${suffix}`,
        name: `TaxMode Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `TMITEM-${suffix}`,
        name: `TaxMode Item ${suffix}`,
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        baseUnitId: unit.id,
        purchaseUnitId: unit.id,
        saleUnitId: unit.id,
        conversionFactor: 1,
        mrp: 200,
        purchaseRate: 100,
      },
    });
    itemId = item.id;

    for (const [documentType, name] of [
      ['PB', 'Purchase Bill'],
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
      purchaseRate: number;
      taxMode: 'EXCLUSIVE' | 'INCLUSIVE';
    }> = {},
  ) {
    return {
      billDate: new Date().toISOString(),
      supplierId,
      warehouseId,
      taxMode: overrides.taxMode,
      items: [
        {
          itemId,
          batchNo: `TM-BATCH-${Date.now()}-${Math.random()}`,
          qty: 1,
          purchaseRate: overrides.purchaseRate ?? 100,
          retailRate: 150,
          wholesaleRate: 140,
          distributorRate: 130,
          mrp: 200,
          discountPercent: 0,
          gstPercent: 18,
        },
      ],
    };
  }

  it('defaults to EXCLUSIVE when taxMode is omitted - unchanged behavior', async () => {
    const created = await request(server)
      .post('/api/purchases')
      .send(purchasePayload({ purchaseRate: 100 }))
      .expect(201);

    expect(created.body.taxMode).toBe('EXCLUSIVE');
    expect(Number(created.body.taxableAmount)).toBe(100);
    expect(Number(created.body.cgstAmount)).toBe(9);
    expect(Number(created.body.sgstAmount)).toBe(9);
    expect(Number(created.body.netAmount)).toBe(118);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    expect(Number(detail.body.items[0].purchaseRate)).toBe(100);
    expect(Number(detail.body.items[0].batch.purchaseRate)).toBe(100);
  });

  it('converts an INCLUSIVE rate to the same exclusive figures, and stores the exclusive rate on the item and batch', async () => {
    // 118 inclusive of 18% GST is exactly 100 exclusive + 18 tax.
    const created = await request(server)
      .post('/api/purchases')
      .send(
        purchasePayload({
          purchaseRate: 118,
          taxMode: 'INCLUSIVE',
        }),
      )
      .expect(201);

    expect(created.body.taxMode).toBe('INCLUSIVE');
    expect(Number(created.body.taxableAmount)).toBe(100);
    expect(Number(created.body.cgstAmount)).toBe(9);
    expect(Number(created.body.sgstAmount)).toBe(9);
    expect(Number(created.body.netAmount)).toBe(118);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    // The stored rate is always tax-exclusive, regardless of how it
    // was entered - this is what profit reports, GSTR ITC, and
    // analytics read as the cost basis.
    expect(Number(detail.body.items[0].purchaseRate)).toBe(100);
    expect(Number(detail.body.items[0].batch.purchaseRate)).toBe(100);
  }, 15000);
});
