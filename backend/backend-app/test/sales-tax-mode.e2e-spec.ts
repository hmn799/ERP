import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Sales-entry GST inclusive/exclusive tax mode.
 *
 * The invariant under test: whichever way the rate was entered, the
 * *stored* saleRate (on the line item, the cost basis every report/
 * analytic reads) is always the tax-exclusive figure - inclusive is
 * purely an input convenience, converted once at save time. Mirrors
 * purchase-tax-mode.e2e-spec.ts.
 *
 * Both cases here rely on the auto-resolved batch rate (no manual
 * saleRate override in the request) so the assertions stay on clean
 * numbers without also exercising the CHANGE_RATE permission gate,
 * which is unrelated to tax mode and covered elsewhere.
 */
describe('Sales tax mode (inclusive/exclusive) (e2e)', () => {
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
      data: { name: `SalesTaxMode Category ${suffix}` },
    });

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `SalesTaxMode-GST18-${suffix}`, percentage: 18 },
    });

    const unit = await prisma.unit.create({
      data: {
        name: `SalesTaxMode-Piece-${suffix}`,
        shortName: `STMPC${suffix}`,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: { name: `SalesTaxMode Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `STMSUP-${suffix}`,
        name: `SalesTaxMode Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });
    supplierId = supplier.id;

    const item = await prisma.item.create({
      data: {
        itemCode: `STMITEM-${suffix}`,
        name: `SalesTaxMode Item ${suffix}`,
        categoryId: category.id,
        gstSlabId: gstSlab.id,
        baseUnitId: unit.id,
        purchaseUnitId: unit.id,
        saleUnitId: unit.id,
        mrp: 300,
        purchaseRate: 60,
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

  /**
   * Creates a fresh batch (via a purchase) with the given retail
   * rate as its stored (always tax-exclusive) rate, and returns its
   * batchId - the sales tests below never send a manual saleRate
   * override, so the batch's retailRate is exactly what the sales
   * calculation resolves to before any tax-mode conversion.
   */
  async function createBatch(retailRate: number) {
    const created = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `STM-BATCH-${Date.now()}-${Math.random()}`,
            qty: 10,
            purchaseRate: 60,
            retailRate,
            wholesaleRate: retailRate,
            distributorRate: retailRate,
            mrp: 300,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    return detail.body.items[0].batchId as string;
  }

  it('defaults to EXCLUSIVE when taxMode is omitted - unchanged behavior', async () => {
    const batchId = await createBatch(100);

    const created = await request(server)
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
          },
        ],
      })
      .expect(201);

    expect(created.body.taxMode).toBe('EXCLUSIVE');
    expect(Number(created.body.taxableAmount)).toBe(100);
    expect(Number(created.body.cgstAmount)).toBe(9);
    expect(Number(created.body.sgstAmount)).toBe(9);
    expect(Number(created.body.netAmount)).toBe(118);

    expect(Number(created.body.items[0].saleRate)).toBe(100);
  });

  it('converts an INCLUSIVE bill to the same exclusive figures, and stores the exclusive rate on the item', async () => {
    // The batch's own retail rate is 118 - under INCLUSIVE mode this
    // is treated as inclusive of 18% GST, exactly 100 exclusive +
    // 18 tax, matching the purchase-side test's clean numbers.
    const batchId = await createBatch(118);

    const created = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        taxMode: 'INCLUSIVE',
        items: [
          {
            itemId,
            batchId,
            qty: 1,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    expect(created.body.taxMode).toBe('INCLUSIVE');
    expect(Number(created.body.taxableAmount)).toBe(100);
    expect(Number(created.body.cgstAmount)).toBe(9);
    expect(Number(created.body.sgstAmount)).toBe(9);
    expect(Number(created.body.netAmount)).toBe(118);

    // The stored rate is always tax-exclusive, regardless of how
    // the bill was entered - this is what reports read as cost.
    expect(Number(created.body.items[0].saleRate)).toBe(100);

    const detail = await request(server)
      .get(`/api/sales/${created.body.id}`)
      .expect(200);

    expect(detail.body.taxMode).toBe('INCLUSIVE');
    expect(Number(detail.body.items[0].saleRate)).toBe(100);
  }, 15000);
});
