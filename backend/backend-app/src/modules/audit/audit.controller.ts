import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('VIEW_AUDIT_LOG')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditService.findAll(query);
  }

  @Get('actions')
  distinctActions() {
    return this.auditService.distinctActions();
  }
}
