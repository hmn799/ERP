import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BankReconciliationService } from './bank-reconciliation.service';

import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { ImportBankTransactionsDto } from './dto/import-bank-transactions.dto';
import { QueryBankTransactionsDto } from './dto/query-bank-transactions.dto';
import { ConfirmMatchDto } from './dto/confirm-match.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('bank-reconciliation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('MANAGE_BANK_RECONCILIATION')
export class BankReconciliationController {
  constructor(
    private readonly reconciliationService: BankReconciliationService,
  ) {}

  @Post('transactions')
  addTransaction(@Body() dto: CreateBankTransactionDto) {
    return this.reconciliationService.addTransaction(dto);
  }

  @Post('transactions/import')
  importTransactions(@Body() dto: ImportBankTransactionsDto) {
    return this.reconciliationService.importTransactions(dto);
  }

  @Get('transactions')
  listTransactions(@Query() query: QueryBankTransactionsDto) {
    return this.reconciliationService.listTransactions(query);
  }

  @Get('transactions/:id/suggestions')
  suggestMatches(@Param('id') id: string) {
    return this.reconciliationService.suggestMatches(id);
  }

  @Post('transactions/:id/match')
  confirmMatch(
    @Param('id') id: string,
    @Body() dto: ConfirmMatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reconciliationService.confirmMatch(id, dto, {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Post('transactions/:id/unmatch')
  unmatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reconciliationService.unmatch(id, {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Post('transactions/:id/ignore')
  ignore(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reconciliationService.ignore(id, {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Get('summary')
  summary(@Query('bankAccountId') bankAccountId: string) {
    return this.reconciliationService.reconciliationSummary(
      bankAccountId,
    );
  }
}
