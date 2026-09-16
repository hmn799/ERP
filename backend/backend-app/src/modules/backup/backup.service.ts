import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

import { PrismaClient } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AuditActor } from '../audit/audit.service';
import { MonitoringService } from '../monitoring/monitoring.service';

import { QueryBackupRunsDto } from './dto/query-backup-runs.dto';
import {
  buildDatabaseUrl,
  parseDatabaseUrl,
} from './utils/db-connection.util';
import {
  decryptFile,
  encryptFile,
} from './utils/backup-encryption.util';

const execFileAsync = promisify(execFile);

export type BackupTrigger = 'MANUAL' | 'SCHEDULED';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly monitoringService: MonitoringService,
  ) {}

  private backupDir(): string {
    return path.resolve(
      process.cwd(),
      process.env.BACKUP_DIR || './backups',
    );
  }

  private pgBin(name: string): string {
    const dir = process.env.PG_BIN_DIR;
    const exe = process.platform === 'win32' ? `${name}.exe` : name;
    return dir ? path.join(dir, exe) : exe;
  }

  private retentionDays(): number {
    return Number(process.env.BACKUP_RETENTION_DAYS || 30);
  }

  /*
   * Runs at 2 AM server time. Failures are recorded on the run itself
   * and in the audit log rather than left as an unhandled rejection -
   * a scheduled job has no caller to report the error to.
   */
  @Cron('0 2 * * *')
  async runScheduledBackup() {
    try {
      await this.runBackup('SCHEDULED');
    } catch {
      // Already recorded as a FAILED BackupRun + BACKUP_FAILED audit event.
    }
  }

  async runBackup(trigger: BackupTrigger, actor?: AuditActor) {
    const dir = this.backupDir();
    await fs.mkdir(dir, { recursive: true });

    const run = await this.prisma.backupRun.create({
      data: {
        status: 'RUNNING',
        trigger,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
      },
    });

    const timestamp = run.startedAt
      .toISOString()
      .replace(/[:.]/g, '-');

    const tmpDumpPath = path.join(dir, `${run.id}.dump.tmp`);
    const finalFileName = `erp-backup-${timestamp}-${run.id}.dump.enc`;
    const finalFilePath = path.join(dir, finalFileName);

    try {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not configured.');
      }

      // Prisma's ?schema= query param is not a libpq-recognized URI
      // parameter - pg_dump rejects it, so the URL is rebuilt without it.
      const dumpParts = parseDatabaseUrl(databaseUrl);
      const dumpUri = buildDatabaseUrl(
        dumpParts,
        dumpParts.database,
      );

      await execFileAsync(this.pgBin('pg_dump'), [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        '--file',
        tmpDumpPath,
        dumpUri,
      ]);

      await encryptFile(tmpDumpPath, finalFilePath);
      await fs.unlink(tmpDumpPath);

      const fileBuffer = await fs.readFile(finalFilePath);
      const checksum = createHash('sha256')
        .update(fileBuffer)
        .digest('hex');
      const stat = await fs.stat(finalFilePath);

      const completed = await this.prisma.backupRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCESS',
          fileName: finalFileName,
          fileSizeBytes: stat.size,
          checksum,
          finishedAt: new Date(),
        },
      });

      await this.auditService.record(this.prisma, {
        actorId: actor?.id,
        actorName: actor?.name,
        action: 'BACKUP_CREATED',
        entityType: 'BackupRun',
        entityId: run.id,
        details: {
          trigger,
          fileName: finalFileName,
          fileSizeBytes: stat.size,
        },
      });

      await this.applyRetention();

      return completed;
    } catch (error: any) {
      await fs.unlink(tmpDumpPath).catch(() => undefined);
      await fs.unlink(finalFilePath).catch(() => undefined);

      const message =
        error?.message || 'Unknown backup failure.';

      this.logger.error(
        `Backup ${run.id} failed: ${message}`,
      );

      await this.prisma.backupRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          errorMessage: message.slice(0, 2000),
          finishedAt: new Date(),
        },
      });

      await this.auditService.record(this.prisma, {
        actorId: actor?.id,
        actorName: actor?.name,
        action: 'BACKUP_FAILED',
        entityType: 'BackupRun',
        entityId: run.id,
        details: { trigger, error: message },
      });

      await this.monitoringService.recordAlert(
        'BACKUP_FAILURE',
        'CRITICAL',
        `Backup failed (${trigger}): ${message}`,
        { runId: run.id, trigger },
        'backup-service',
      );

      throw error;
    }
  }

  private async applyRetention() {
    const days = this.retentionDays();
    const cutoff = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000,
    );

    const stale = await this.prisma.backupRun.findMany({
      where: {
        status: 'SUCCESS',
        fileName: { not: null },
        startedAt: { lt: cutoff },
      },
    });

    for (const staleRun of stale) {
      if (!staleRun.fileName) continue;

      const filePath = path.join(
        this.backupDir(),
        staleRun.fileName,
      );

      await fs.unlink(filePath).catch(() => undefined);

      await this.prisma.backupRun.update({
        where: { id: staleRun.id },
        data: { fileName: null, checksum: null },
      });
    }
  }

  async listRuns(query: QueryBackupRunsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const [total, items] = await Promise.all([
      this.prisma.backupRun.count(),
      this.prisma.backupRun.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async getDownloadInfo(id: string) {
    const run = await this.prisma.backupRun.findUnique({
      where: { id },
    });

    if (!run) {
      throw new NotFoundException('Backup run not found.');
    }

    if (run.status !== 'SUCCESS' || !run.fileName) {
      throw new BadRequestException(
        'This backup run does not have a downloadable file.',
      );
    }

    const filePath = path.join(
      this.backupDir(),
      run.fileName,
    );

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(
        'Backup file is no longer available on disk (it may have been pruned by retention).',
      );
    }

    return { filePath, fileName: run.fileName };
  }

  async runRestoreDrill(id: string, actor?: AuditActor) {
    const run = await this.prisma.backupRun.findUnique({
      where: { id },
    });

    if (!run) {
      throw new NotFoundException('Backup run not found.');
    }

    if (run.status !== 'SUCCESS' || !run.fileName) {
      throw new BadRequestException(
        'Only a successful backup with a file on disk can be restore-tested.',
      );
    }

    const dir = this.backupDir();
    const encryptedPath = path.join(dir, run.fileName);

    try {
      await fs.access(encryptedPath);
    } catch {
      throw new NotFoundException(
        'Backup file is no longer available on disk.',
      );
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const parts = parseDatabaseUrl(databaseUrl);
    const adminUrl = buildDatabaseUrl(parts, 'postgres');

    const scratchDbName = `erp_restore_drill_${run.id.toLowerCase()}`;
    const scratchUrl = buildDatabaseUrl(
      parts,
      scratchDbName,
    );

    const decryptedPath = path.join(
      dir,
      `${run.id}.restore.tmp`,
    );

    try {
      await decryptFile(encryptedPath, decryptedPath);

      await execFileAsync(this.pgBin('psql'), [
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `DROP DATABASE IF EXISTS "${scratchDbName}";`,
        adminUrl,
      ]);

      await execFileAsync(this.pgBin('psql'), [
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `CREATE DATABASE "${scratchDbName}";`,
        adminUrl,
      ]);

      await execFileAsync(this.pgBin('pg_restore'), [
        '--no-owner',
        '--no-privileges',
        '-d',
        scratchUrl,
        decryptedPath,
      ]);

      const scratchClient = new PrismaClient({
        datasources: { db: { url: scratchUrl } },
      });

      let detail: Record<string, unknown>;

      try {
        const [permissionCount, roleCount] =
          await Promise.all([
            scratchClient.permission.count(),
            scratchClient.role.count(),
          ]);

        if (permissionCount === 0) {
          throw new Error(
            'Restored database has no permission rows - the restore looks incomplete.',
          );
        }

        detail = { permissionCount, roleCount };
      } finally {
        await scratchClient.$disconnect();
      }

      await this.prisma.backupRun.update({
        where: { id: run.id },
        data: { restoreVerifiedAt: new Date() },
      });

      await this.auditService.record(this.prisma, {
        actorId: actor?.id,
        actorName: actor?.name,
        action: 'RESTORE_DRILL_SUCCEEDED',
        entityType: 'BackupRun',
        entityId: run.id,
        details: { fileName: run.fileName, ...detail },
      });

      return { success: true, ...detail };
    } catch (error: any) {
      const message =
        error?.message || 'Unknown restore drill failure.';

      this.logger.error(
        `Restore drill for ${run.id} failed: ${message}`,
      );

      await this.auditService.record(this.prisma, {
        actorId: actor?.id,
        actorName: actor?.name,
        action: 'RESTORE_DRILL_FAILED',
        entityType: 'BackupRun',
        entityId: run.id,
        details: { fileName: run.fileName, error: message },
      });

      throw new BadRequestException(
        `Restore drill failed: ${message}`,
      );
    } finally {
      await execFileAsync(this.pgBin('psql'), [
        '-c',
        `DROP DATABASE IF EXISTS "${scratchDbName}";`,
        adminUrl,
      ]).catch(() => undefined);

      await fs.unlink(decryptedPath).catch(() => undefined);
    }
  }
}
