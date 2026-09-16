import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';

/**
 * Smoke tests for report endpoints that back the new report pages.
 * These endpoints existed already but had never been called by a
 * real client - this just confirms each one responds and returns
 * the shape the frontend expects, against whatever data is already
 * in erp_db_test.
 */
describe('Reports - smoke (e2e)', () => {
  let app: INestApplication<App>;
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /reports/sales-register returns an array of bill rows', async () => {
    const res = await request(server)
      .get('/api/reports/sales-register')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const row = res.body[0];
      expect(row).toHaveProperty('billNo');
      expect(row).toHaveProperty('customerName');
      expect(row).toHaveProperty('netAmount');
    }
  });

  it('GET /reports/item-sales-report returns an array of item rows', async () => {
    const res = await request(server)
      .get('/api/reports/item-sales-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /reports/party-sales-report returns an array of party rows', async () => {
    const res = await request(server)
      .get('/api/reports/party-sales-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /reports/purchase-register returns an array of bill rows', async () => {
    const res = await request(server)
      .get('/api/reports/purchase-register')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('supplierName');
    }
  });

  it('GET /reports/stock-report returns an array of stock rows', async () => {
    const res = await request(server)
      .get('/api/reports/stock-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /reports/batch-stock-report returns an array of batch rows', async () => {
    const res = await request(server)
      .get('/api/reports/batch-stock-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /reports/stock-valuation-report returns items + totalStockValue', async () => {
    const res = await request(server)
      .get('/api/reports/stock-valuation-report')
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.totalStockValue).toBe(
      'number',
    );
  });

  it('GET /reports/stock-ledger-report returns an array of movement rows', async () => {
    const res = await request(server)
      .get('/api/reports/stock-ledger-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('balance');
    }
  });

  it('GET /reports/profit-report returns an array of profit rows', async () => {
    const res = await request(server)
      .get('/api/reports/profit-report')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('profit');
    }
  });

  it('GET /reports/gst-summary returns a single summary object', async () => {
    const res = await request(server)
      .get('/api/reports/gst-summary')
      .expect(200);

    expect(typeof res.body.taxableAmount).toBe(
      'number',
    );
    expect(typeof res.body.salesCount).toBe('number');
    expect(typeof res.body.purchaseCount).toBe(
      'number',
    );
  });
});
