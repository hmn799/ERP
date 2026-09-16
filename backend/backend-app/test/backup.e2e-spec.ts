import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Backups (e2e)', () => {
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
      where: { name: 'NoPermBackupRole' },
      update: {},
      create: { name: 'NoPermBackupRole' },
    });

    await prisma.user.upsert({
      where: { username: `backup-noperm-${suffix}` },
      update: {},
      create: {
        username: `backup-noperm-${suffix}`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: 'No Permission User',
        roleId: noPermRole.id,
      },
    });

    const noPermLogin = await request(server)
      .post('/api/auth/login')
      .send({
        username: `backup-noperm-${suffix}`,
        password: 'password123',
      })
      .expect(201);

    noPermToken = noPermLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires login and MANAGE_BACKUPS for every backup endpoint', async () => {
    await request(server).get('/api/backups').expect(401);
    await request(server)
      .get('/api/backups')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);
    await request(server)
      .get('/api/backups')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(server).post('/api/backups/run').expect(401);
    await request(server)
      .post('/api/backups/run')
      .set('Authorization', `Bearer ${noPermToken}`)
      .expect(403);
  });

  it('creates an encrypted, checksummed backup that downloads byte-for-byte and restore-verifies', async () => {
    const runRes = await request(server)
      .post('/api/backups/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const run = runRes.body;
    expect(run.status).toBe('SUCCESS');
    expect(run.fileName).toBeTruthy();
    expect(run.fileSizeBytes).toBeGreaterThan(0);
    expect(run.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(run.actorName).toBeTruthy();

    const listRes = await request(server)
      .get('/api/backups')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(
      listRes.body.items.some((r: any) => r.id === run.id),
    ).toBe(true);

    const downloadRes = await request(server)
      .get(`/api/backups/${run.id}/download`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    const downloadedChecksum = createHash('sha256')
      .update(downloadRes.body as Buffer)
      .digest('hex');

    expect(downloadedChecksum).toBe(run.checksum);

    // The file is genuinely encrypted, not a plain pg_dump.
    const header = (downloadRes.body as Buffer)
      .subarray(0, 5)
      .toString('utf8');
    expect(header).not.toBe('PGDMP');

    const drillRes = await request(server)
      .post(`/api/backups/${run.id}/restore-drill`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(drillRes.body.success).toBe(true);
    expect(drillRes.body.permissionCount).toBeGreaterThan(0);

    const afterDrill = await prisma.backupRun.findUnique({
      where: { id: run.id },
    });
    expect(afterDrill?.restoreVerifiedAt).toBeTruthy();
  }, 30000);

  it('rejects download and restore-drill for a run that does not exist', async () => {
    await request(server)
      .get('/api/backups/does-not-exist/download')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    await request(server)
      .post('/api/backups/does-not-exist/restore-drill')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('prunes the file of a backup older than the retention window on the next run', async () => {
    const oldRun = await prisma.backupRun.create({
      data: {
        status: 'SUCCESS',
        trigger: 'MANUAL',
        fileName: 'this-file-does-not-exist-on-disk.dump.enc',
        fileSizeBytes: 123,
        checksum: 'deadbeef',
        startedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        finishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    });

    await request(server)
      .post('/api/backups/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const pruned = await prisma.backupRun.findUnique({
      where: { id: oldRun.id },
    });

    expect(pruned?.fileName).toBeNull();
    expect(pruned?.checksum).toBeNull();
  }, 30000);
});
