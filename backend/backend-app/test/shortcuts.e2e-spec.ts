import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Shortcut registry (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let server: App;

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

    const adminLogin = await request(server)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;

    const suffix = Date.now().toString(36);

    const noPermRole = await prisma.role.upsert({
      where: { name: 'NoPermShortcutRole' },
      update: {},
      create: { name: 'NoPermShortcutRole' },
    });

    await prisma.user.upsert({
      where: { username: `shortcut-noperm-${suffix}` },
      update: {},
      create: {
        username: `shortcut-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `shortcut-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;

    (globalThis as any).__shortcutTestFixtures = {
      noPermRole,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists all seeded shortcuts', async () => {
    const res = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(14);

    const holdBill = res.body.find(
      (s: any) => s.actionCode === 'HOLD_BILL',
    );

    expect(holdBill).toBeTruthy();
    expect(holdBill.currentKey).toBe('F6');
    expect(holdBill.isEnabled).toBe(true);
  });

  it('returns the effective shortcut map for a role, all enabled by default', async () => {
    const { noPermRole } = (globalThis as any)
      .__shortcutTestFixtures;

    const res = await request(server)
      .get(`/api/shortcuts/effective/${noPermRole.id}`)
      .expect(200);

    const holdBill = res.body.find(
      (s: any) => s.actionCode === 'HOLD_BILL',
    );

    expect(holdBill.enabled).toBe(true);
    expect(holdBill.key).toBe('F6');
  });

  it('requires login and MANAGE_SETTINGS to rebind a shortcut', async () => {
    const all = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const target = all.body.find(
      (s: any) => s.actionCode === 'ITEM_INFO',
    );

    await request(server)
      .put(`/api/shortcuts/${target.id}`)
      .send({ currentKey: 'Ctrl+Shift+I' })
      .expect(401);

    await request(server)
      .put(`/api/shortcuts/${target.id}`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .send({ currentKey: 'Ctrl+Shift+I' })
      .expect(403);
  });

  it('rebinds a shortcut and normalizes the key combination', async () => {
    const all = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const target = all.body.find(
      (s: any) => s.actionCode === 'ITEM_INFO',
    );

    const res = await request(server)
      .put(`/api/shortcuts/${target.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentKey: 'shift + ctrl + i' })
      .expect(200);

    expect(res.body.currentKey).toBe('Ctrl+Shift+I');
  });

  it('rejects rebinding to a key already used by another enabled shortcut', async () => {
    const all = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const target = all.body.find(
      (s: any) => s.actionCode === 'OUTSTANDING',
    );

    const holdBill = all.body.find(
      (s: any) => s.actionCode === 'HOLD_BILL',
    );

    const res = await request(server)
      .put(`/api/shortcuts/${target.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentKey: holdBill.currentKey })
      .expect(409);

    expect(res.body.message).toContain('Hold Bill');
  });

  it('resets a shortcut back to its default key', async () => {
    const all = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const target = all.body.find(
      (s: any) => s.actionCode === 'ITEM_INFO',
    );

    const res = await request(server)
      .put(`/api/shortcuts/${target.id}/reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.currentKey).toBe(
      res.body.defaultKey,
    );
  });

  it('excludes a role from a shortcut without affecting other roles', async () => {
    const { noPermRole } = (globalThis as any)
      .__shortcutTestFixtures;

    const all = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const target = all.body.find(
      (s: any) => s.actionCode === 'DEBIT_NOTE',
    );

    await request(server)
      .put(
        `/api/shortcuts/${target.id}/role/${noPermRole.id}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEnabled: false })
      .expect(200);

    const effective = await request(server)
      .get(`/api/shortcuts/effective/${noPermRole.id}`)
      .expect(200);

    const debitNote = effective.body.find(
      (s: any) => s.actionCode === 'DEBIT_NOTE',
    );

    expect(debitNote.enabled).toBe(false);

    // Shortcut stays globally enabled for everyone else.
    const globalList = await request(server)
      .get('/api/shortcuts')
      .expect(200);

    const globalDebitNote = globalList.body.find(
      (s: any) => s.actionCode === 'DEBIT_NOTE',
    );

    expect(globalDebitNote.isEnabled).toBe(true);

    // Removing the override restores default eligibility.
    await request(server)
      .delete(
        `/api/shortcuts/${target.id}/role/${noPermRole.id}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const restored = await request(server)
      .get(`/api/shortcuts/effective/${noPermRole.id}`)
      .expect(200);

    const restoredDebitNote = restored.body.find(
      (s: any) => s.actionCode === 'DEBIT_NOTE',
    );

    expect(restoredDebitNote.enabled).toBe(true);
  });
});
