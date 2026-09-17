import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('GST returns (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

  let warehouseId: string;
  let supplierId: string;
  let categoryId: string;
  let gstSlabId: string;
  let unitId: string;

  let b2bCustomerId: string;
  let b2cCustomerId: string;

  let itemWithHsnId: string;
  let itemNoHsnId: string;

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

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
      where: { name: 'NoPermGstRole' },
      update: {},
      create: { name: 'NoPermGstRole' },
    });

    await prisma.user.upsert({
      where: { username: `gst-noperm-${suffix}` },
      update: {},
      create: {
        username: `gst-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `gst-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const category = await prisma.category.create({
      data: { name: `GST Category ${suffix}` },
    });
    categoryId = category.id;

    const gstSlab = await prisma.gSTSlab.create({
      data: { name: `GST-GST18-${suffix}`, percentage: 18 },
    });
    gstSlabId = gstSlab.id;

    const unit = await prisma.unit.create({
      data: { name: `GST-Piece-${suffix}`, shortName: `GPC${suffix}` },
    });
    unitId = unit.id;

    const warehouse = await prisma.warehouse.create({
      data: { name: `GST Warehouse ${suffix}` },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `GSTSUP-${suffix}`,
        name: `GST Supplier ${suffix}`,
        gstType: 'REGISTERED',
        gstin: `24AAAAA${suffix.slice(0, 4).toUpperCase()}A1Z5`,
      },
    });
    supplierId = supplier.id;

    const b2bCustomer = await prisma.customer.create({
      data: {
        customerCode: `GSTB2B-${suffix}`,
        name: `GST B2B Customer ${suffix}`,
        customerGroup: 'WHOLESALE',
        gstCategory: 'REGISTERED',
        gstin: `27BBBBB${suffix.slice(0, 4).toUpperCase()}B1Z5`,
        state: 'MAHARASHTRA',
      },
    });
    b2bCustomerId = b2bCustomer.id;

    const b2cCustomer = await prisma.customer.create({
      data: {
        customerCode: `GSTB2C-${suffix}`,
        name: `GST B2C Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
        state: 'GUJARAT',
      },
    });
    b2cCustomerId = b2cCustomer.id;

    const itemWithHsn = await prisma.item.create({
      data: {
        itemCode: `GSTHSN-${suffix}`,
        name: `GST Item With HSN ${suffix}`,
        hsnCode: '33049910',
        categoryId,
        gstSlabId,
        baseUnitId: unitId,
        purchaseUnitId: unitId,
        saleUnitId: unitId,
        mrp: 100,
        purchaseRate: 40,
      },
    });
    itemWithHsnId = itemWithHsn.id;

    const itemNoHsn = await prisma.item.create({
      data: {
        itemCode: `GSTNOHSN-${suffix}`,
        name: `GST Item No HSN ${suffix}`,
        categoryId,
        gstSlabId,
        baseUnitId: unitId,
        purchaseUnitId: unitId,
        saleUnitId: unitId,
        mrp: 50,
        purchaseRate: 20,
      },
    });
    itemNoHsnId = itemNoHsn.id;

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
    await prisma.systemSetting
      .deleteMany({
        where: {
          settingKey: {
            in: ['company.gstin', 'company.legalName'],
          },
        },
      })
      .catch(() => undefined);

    await app.close();
  });

  async function createPurchase(
    itemId: string,
    qty: number,
    purchaseRate: number,
  ) {
    const created = await request(server)
      .post('/api/purchases')
      .send({
        billDate: new Date().toISOString(),
        supplierId,
        warehouseId,
        items: [
          {
            itemId,
            batchNo: `GST-BATCH-${Date.now()}-${Math.random()}`,
            qty,
            purchaseRate,
            retailRate: purchaseRate * 2,
            wholesaleRate: purchaseRate * 1.8,
            distributorRate: purchaseRate * 1.6,
            mrp: purchaseRate * 2.5,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      })
      .expect(201);

    const detail = await request(server)
      .get(`/api/purchases/${created.body.id}`)
      .expect(200);

    return { header: created.body, batchId: detail.body.items[0].batchId };
  }

  it('requires login and VIEW_PROFIT for both GST return endpoints', async () => {
    for (const path of [
      '/api/reports/gstr1',
      '/api/reports/gstr3b',
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

  it('classifies a sale to a GSTIN-holding customer as B2B and one to an unregistered customer as B2C(S), with an HSN summary', async () => {
    const { batchId: hsnBatchId } = await createPurchase(
      itemWithHsnId,
      50,
      40,
    );
    const { batchId: noHsnBatchId } = await createPurchase(
      itemNoHsnId,
      50,
      20,
    );

    const b2bSale = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId: b2bCustomerId,
        items: [
          {
            itemId: itemWithHsnId,
            batchId: hsnBatchId,
            qty: 10,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 80,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 944 }],
      })
      .expect(201);

    const b2cSale = await request(server)
      .post('/api/sales')
      .send({
        billDate: new Date().toISOString(),
        warehouseId,
        customerId: b2cCustomerId,
        items: [
          {
            itemId: itemNoHsnId,
            batchId: noHsnBatchId,
            qty: 5,
            discountPercent: 0,
            gstPercent: 18,
            saleRate: 40,
          },
        ],
        payments: [{ paymentMode: 'CASH', amount: 236 }],
      })
      .expect(201);

    const res = await request(server)
      .get('/api/reports/gstr1')
      .query({ month: period })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const b2bRow = res.body.b2b.find(
      (r: any) => r.billNo === b2bSale.body.billNo,
    );

    expect(b2bRow).toBeTruthy();
    expect(b2bRow.gstin).toContain('B1Z5');
    expect(b2bRow.placeOfSupply).toBe('MAHARASHTRA');
    expect(b2bRow.taxableValue).toBe(800);
    expect(b2bRow.cgst).toBe(72);
    expect(b2bRow.sgst).toBe(72);

    // The B2C sale must NOT appear in b2b.
    expect(
      res.body.b2b.some(
        (r: any) => r.billNo === b2cSale.body.billNo,
      ),
    ).toBe(false);

    const b2csRow = res.body.b2cSmall.find(
      (r: any) =>
        r.placeOfSupply === 'GUJARAT' &&
        r.ratePercent === 18,
    );
    expect(b2csRow).toBeTruthy();
    expect(b2csRow.taxableValue).toBeGreaterThanOrEqual(
      200,
    );

    const hsnRow = res.body.hsnSummary.find(
      (r: any) => r.hsnCode === '33049910',
    );
    expect(hsnRow).toBeTruthy();
    expect(hsnRow.qty).toBeGreaterThanOrEqual(10);

    const unspecifiedRow = res.body.hsnSummary.find(
      (r: any) => r.hsnCode === 'UNSPECIFIED',
    );
    expect(unspecifiedRow).toBeTruthy();
  }, 30000);

  it('computes GSTR-3B outward tax and ITC from real purchase and sales data for the period', async () => {
    const res = await request(server)
      .get('/api/reports/gstr3b')
      .query({ month: period })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.period).toBe(period);
    expect(
      res.body.section3_1OutwardSupplies
        .taxableOutwardSupplies.taxableValue,
    ).toBeGreaterThan(0);
    expect(
      res.body.section4EligibleItc.allOtherItc.taxableValue,
    ).toBeGreaterThan(0);

    const { taxableOutwardSupplies } =
      res.body.section3_1OutwardSupplies;
    const { netEligibleItc } = res.body.section4EligibleItc;
    const { section6_1TaxPayable } = res.body;

    const expectedCgst = Math.max(
      0,
      Number(
        (
          taxableOutwardSupplies.cgst -
          netEligibleItc.cgst
        ).toFixed(2),
      ),
    );

    expect(section6_1TaxPayable.cgst).toBe(expectedCgst);
  });

  it('surfaces a configured company GSTIN and legal name in both returns', async () => {
    await prisma.systemSetting.upsert({
      where: { settingKey: 'company.gstin' },
      update: { value: '24TESTGSTIN0001Z5' },
      create: {
        groupName: 'company',
        settingKey: 'company.gstin',
        value: '24TESTGSTIN0001Z5',
        valueType: 'STRING',
      },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: 'company.legalName' },
      update: { value: 'Test Legal Name' },
      create: {
        groupName: 'company',
        settingKey: 'company.legalName',
        value: 'Test Legal Name',
        valueType: 'STRING',
      },
    });

    const [gstr1Res, gstr3bRes] = await Promise.all([
      request(server)
        .get('/api/reports/gstr1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200),
      request(server)
        .get('/api/reports/gstr3b')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200),
    ]);

    expect(gstr1Res.body.company.gstin).toBe(
      '24TESTGSTIN0001Z5',
    );
    expect(gstr1Res.body.company.legalName).toBe(
      'Test Legal Name',
    );
    expect(
      gstr1Res.body.notes.some((n: string) =>
        n.includes('GSTIN is not configured'),
      ),
    ).toBe(false);

    expect(gstr3bRes.body.company.gstin).toBe(
      '24TESTGSTIN0001Z5',
    );
  });
});
