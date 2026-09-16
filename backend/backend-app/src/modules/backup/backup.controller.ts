import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { BackupService } from './backup.service';
import { QueryBackupRunsDto } from './dto/query-backup-runs.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('backups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('MANAGE_BACKUPS')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  findAll(@Query() query: QueryBackupRunsDto) {
    return this.backupService.listRuns(query);
  }

  @Post('run')
  run(@CurrentUser() user: AuthUser) {
    return this.backupService.runBackup('MANUAL', {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Post(':id/restore-drill')
  restoreDrill(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.backupService.runRestoreDrill(id, {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } =
      await this.backupService.getDownloadInfo(id);

    res.download(filePath, fileName);
  }
}
