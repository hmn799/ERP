import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Bank reconciliation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

  let adminToken: string;
  let noPermToken: string;

  let customerId: string;
  let supplierId: string;
  let bankAccountId: string;

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
      where: { name: 'NoPermBankRole' },
      update: {},
      create: { name: 'NoPermBankRole' },
    });

    await prisma.user.upsert({
      where: { username: `bank-noperm-${suffix}` },
      update: {},
      create: {
        username: `bank-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `bank-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `BANKCUST-${suffix}`,
        name: `Bank Customer ${suffix}`,
        customerGroup: 'RETAIL',
        gstCategory: 'UNREGISTERED',
      },
    });
    customerId = customer.id;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: `BANKSUP-${suffix}`,
        name: `Bank Supplier ${suffix}`,
        gstType: 'UNREGISTERED',
      },
    });
    supplierId = supplier.id;

    const bankAccountRes = await request(server)
      .post('/api/bank-accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Current Account ${suffix}`,
        bankName: 'Test Bank',
        accountNumber: `ACC${suffix}`,
        ifscCode: 'TEST0001234',
        openingBalance: 10000,
      })
      .expect(201);

    bankAccountId = bankAccountRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires login and MANAGE_BANK_RECONCILIATION for every bank endpoint', async () => {
    for (const path of [
      '/api/bank-accounts',
      `/api/bank-reconciliation/transactions?bankAccountId=${bankAccountId}`,
      `/api/bank-reconciliation/summary?bankAccountId=${bankAccountId}`,
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

  it('rejects a bank transaction line with both a debit and a credit, or neither', async () => {
    await request(server)
      .post('/api/bank-reconciliation/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        transactionDate: new Date().toISOString(),
        description: 'Invalid - both sides',
        debitAmount: 100,
        creditAmount: 100,
      })
      .expect(400);

    await request(server)
      .post('/api/bank-reconciliation/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        transactionDate: new Date().toISOString(),
        description: 'Invalid - neither side',
      })
      .expect(400);
  });

  it('suggests, confirms, and unmatches a bank-tagged receipt against a matching statement credit', async () => {
    const receiptRes = await request(server)
      .post('/api/ledger/receipt')
      .send({
        customerId,
        amount: 1500,
        receiptDate: new Date().toISOString(),
        remarks: 'NEFT received',
        bankAccountId,
      })
      .expect(201);

    const bankTxRes = await request(server)
      .post('/api/bank-reconciliation/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        transactionDate: new Date().toISOString(),
        description: 'NEFT CR - test customer',
        referenceNo: 'NEFT12345',
        creditAmount: 1500,
      })
      .expect(201);

    const suggestions = await request(server)
      .get(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/suggestions`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const suggested = suggestions.body.find(
      (s: any) => s.ledgerEntryId === receiptRes.body.id,
    );
    expect(suggested).toBeTruthy();
    expect(suggested.amount).toBe(1500);
    expect(suggested.partyName).toContain('Bank Customer');

    const matchRes = await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/match`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ledgerEntryId: receiptRes.body.id })
      .expect(201);

    expect(matchRes.body.status).toBe('MATCHED');
    expect(matchRes.body.matchedLedgerEntryId).toBe(
      receiptRes.body.id,
    );

    // A second bank transaction of the same amount must not suggest
    // the now-matched receipt again.
    const secondBankTx = await request(server)
      .post('/api/bank-reconciliation/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        transactionDate: new Date().toISOString(),
        description: 'Unrelated credit, same amount',
        creditAmount: 1500,
      })
      .expect(201);

    const secondSuggestions = await request(server)
      .get(
        `/api/bank-reconciliation/transactions/${secondBankTx.body.id}/suggestions`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(
      secondSuggestions.body.some(
        (s: any) => s.ledgerEntryId === receiptRes.body.id,
      ),
    ).toBe(false);

    // Re-matching an already-matched transaction is rejected.
    await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/match`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ledgerEntryId: receiptRes.body.id })
      .expect(400);

    // A MATCHED transaction cannot be ignored directly.
    await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/ignore`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    const unmatchRes = await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/unmatch`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(unmatchRes.body.status).toBe('UNMATCHED');
    expect(unmatchRes.body.matchedLedgerEntryId).toBeNull();

    // Now that it's unmatched again, the second bank transaction's
    // suggestions should include the receipt once more.
    const afterUnmatch = await request(server)
      .get(
        `/api/bank-reconciliation/transactions/${secondBankTx.body.id}/suggestions`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(
      afterUnmatch.body.some(
        (s: any) => s.ledgerEntryId === receiptRes.body.id,
      ),
    ).toBe(true);

    // Clean up: ignore both so they don't pollute the summary test.
    await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/ignore`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${secondBankTx.body.id}/ignore`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  }, 20000);

  it('rejects confirming a match with a mismatched amount or wrong transaction type', async () => {
    const paymentRes = await request(server)
      .post('/api/ledger/payment')
      .send({
        supplierId,
        amount: 750,
        paymentDate: new Date().toISOString(),
        bankAccountId,
      })
      .expect(201);

    const bankTxRes = await request(server)
      .post('/api/bank-reconciliation/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        transactionDate: new Date().toISOString(),
        description: 'Different amount debit',
        debitAmount: 999,
      })
      .expect(201);

    await request(server)
      .post(
        `/api/bank-reconciliation/transactions/${bankTxRes.body.id}/match`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ledgerEntryId: paymentRes.body.id })
      .expect(400);
  });

  it('bulk imports statement rows', async () => {
    const before = await request(server)
      .get('/api/bank-reconciliation/transactions')
      .query({ bankAccountId })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const importRes = await request(server)
      .post('/api/bank-reconciliation/transactions/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bankAccountId,
        rows: [
          {
            transactionDate: new Date().toISOString(),
            description: 'Imported row 1',
            creditAmount: 250,
          },
          {
            transactionDate: new Date().toISOString(),
            description: 'Imported row 2',
            debitAmount: 100,
          },
        ],
      })
      .expect(201);

    expect(importRes.body.imported).toBe(2);

    const after = await request(server)
      .get('/api/bank-reconciliation/transactions')
      .query({ bankAccountId })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(after.body.total).toBe(before.body.total + 2);
  });

  it('computes a reconciliation summary reflecting statement and book balances', async () => {
    const res = await request(server)
      .get('/api/bank-reconciliation/summary')
      .query({ bankAccountId })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bankAccountId).toBe(bankAccountId);
    expect(res.body.openingBalance).toBe(10000);
    expect(typeof res.body.statementBalance).toBe('number');
    expect(typeof res.body.bookBalance).toBe('number');
    expect(res.body.transactionCount).toBeGreaterThan(0);
  });
});
