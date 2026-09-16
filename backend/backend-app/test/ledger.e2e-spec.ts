import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

/**
 * Ledger receipt/payment tests.
 *
 * CreateReceiptDto/CreatePaymentDto previously had zero
 * class-validator decorators, so the app's global
 * `whitelist: true` pipe silently stripped every field on a
 * real request. These tests exercise the real HTTP + validation
 * pipeline (not just the service) so that regression is caught.
 */
describe('Ledger receipts/payments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a receipt for a non-existent customer', async () => {
    await request(server)
      .post('/api/ledger/receipt')
      .send({
        customerId: 'does-not-exist',
        amount: 100,
        receiptDate: new Date().toISOString(),
      })
      .expect(400);
  });

  it('rejects a receipt with a non-positive amount', async () => {
    const suffix = Date.now().toString(36);

    const customer = await prisma.customer.create({
      data: {
        customerCode: `LEDCUST-${suffix}`,
        name: `Ledger Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });

    await request(server)
      .post('/api/ledger/receipt')
      .send({
        customerId: customer.id,
        amount: 0,
        receiptDate: new Date().toISOString(),
      })
      .expect(400);
  });

  it('records a receipt and it shows up in the customer ledger and the receipts list', async () => {
    const suffix = Date.now().toString(36);

    const customer = await prisma.customer.create({
      data: {
        customerCode: `LEDCUST2-${suffix}`,
        name: `Ledger Customer 2 ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });

    const receiptRes = await request(server)
      .post('/api/ledger/receipt')
      .send({
        customerId: customer.id,
        amount: 250.5,
        receiptDate: new Date().toISOString(),
        remarks: 'Cash collection',
      })
      .expect(201);

    // The DTO had no validators before this fix, so whitelist
    // stripping would have silently dropped every field and
    // this would have persisted amount = 0 / wrong customer.
    expect(Number(receiptRes.body.creditAmount)).toBe(250.5);
    expect(receiptRes.body.partyId).toBe(customer.id);

    const ledger = await request(server)
      .get(`/api/ledger/customer/${customer.id}`)
      .expect(200);

    expect(ledger.body).toHaveLength(1);
    expect(Number(ledger.body[0].creditAmount)).toBe(250.5);

    const list = await request(server)
      .get('/api/ledger/receipts')
      .expect(200);

    const found = list.body.find(
      (row: any) => row.id === receiptRes.body.id,
    );

    expect(found).toBeTruthy();
    expect(found.customerName).toBe(customer.name);
    expect(found.amount).toBe(250.5);
  });

  it('rejects a payment for a non-existent supplier', async () => {
    await request(server)
      .post('/api/ledger/payment')
      .send({
        supplierId: 'does-not-exist',
        amount: 100,
        paymentDate: new Date().toISOString(),
      })
      .expect(400);
  });

  it('records a payment and it shows up in the supplier ledger and the payments list', async () => {
    const suffix = Date.now().toString(36);

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `LEDSUP-${suffix}`,
        name: `Ledger Supplier ${suffix}`,
        gstType: 'REGISTERED',
      },
    });

    const paymentRes = await request(server)
      .post('/api/ledger/payment')
      .send({
        supplierId: supplier.id,
        amount: 400,
        paymentDate: new Date().toISOString(),
        remarks: 'Advance payment',
      })
      .expect(201);

    expect(Number(paymentRes.body.debitAmount)).toBe(400);
    expect(paymentRes.body.partyId).toBe(supplier.id);

    const ledger = await request(server)
      .get(`/api/ledger/supplier/${supplier.id}`)
      .expect(200);

    expect(ledger.body).toHaveLength(1);
    expect(Number(ledger.body[0].debitAmount)).toBe(400);

    const list = await request(server)
      .get('/api/ledger/payments')
      .expect(200);

    const found = list.body.find(
      (row: any) => row.id === paymentRes.body.id,
    );

    expect(found).toBeTruthy();
    expect(found.supplierName).toBe(supplier.name);
    expect(found.amount).toBe(400);
  });
});
