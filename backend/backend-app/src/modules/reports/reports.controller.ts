import {
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import { SlowQueryInterceptor } from '../../core/monitoring/slow-query.interceptor';

@Controller('reports')
@UseInterceptors(SlowQueryInterceptor)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('supplier-outstanding')
  supplierOutstanding() {
    return this.reportsService.supplierOutstanding();
  }

  @Get('customer-outstanding')
  customerOutstanding() {
    return this.reportsService.customerOutstanding();
  }

  @Get('customer-ledger/:id')
  customerLedger(
    @Param('id') id: string,
  ) {
    return this.reportsService.customerLedger(id);
  }

  @Get('customer-billing-summary/:id')
  customerBillingSummary(
    @Param('id') id: string,
  ) {
    return this.reportsService.customerBillingSummary(
      id,
    );
  }

  @Get('supplier-ledger/:id')
  supplierLedger(
    @Param('id') id: string,
  ) {
    return this.reportsService.supplierLedger(id);
  }

  @Get('customer-statement/:id')
  customerStatement(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.customerStatement(
      id,
      from,
      to,
    );
  }

  @Get('supplier-statement/:id')
  supplierStatement(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.supplierStatement(
      id,
      from,
      to,
    );
  }

  @Get('day-book')
dayBook(
  @Query('from') from: string,
  @Query('to') to: string,
) {
  return this.reportsService.dayBook(
    from,
    to,
  );
}

@Get('cash-book')
cashBook(
  @Query('from') from: string,
  @Query('to') to: string,
) {
  return this.reportsService.cashBook(
    from,
    to,
  );
}

@Get('stock-report')
stockReport() {
  return this.reportsService.stockReport();
}

@Get('batch-stock-report')
batchStockReport() {
  return this.reportsService.batchStockReport();
}

@Get('expiry-report')
expiryReport() {
  return this.reportsService.expiryReport();
}

@Get('profit-report')
profitReport() {
  return this.reportsService.profitReport();
}

@Get('item-sales-report')
itemSalesReport() {
  return this.reportsService.itemSalesReport();
}

@Get('party-sales-report')
partySalesReport() {
  return this.reportsService.partySalesReport();
}

@Get('fast-moving-items')
fastMovingItems() {
  return this.reportsService.fastMovingItems();
}

@Get('dead-stock-report')
deadStockReport() {
  return this.reportsService.deadStockReport();
}

@Get('dashboard')
dashboard() {
  return this.reportsService.dashboard();
}

@Get('sales-trend')
salesTrend(
  @Query('days') days?: string,
) {
  return this.reportsService.salesTrend(
    days ? Number(days) : 14,
  );
}

@Get('sales-register')
salesRegister() {
  return this.reportsService.salesRegister();
}

@Get('purchase-register')
purchaseRegister() {
  return this.reportsService.purchaseRegister();
}

@Get('gst-summary')
gstSummary() {
  return this.reportsService.gstSummary();
}

@Get('stock-ledger-report')
stockLedgerReport() {
  return this.reportsService.stockLedgerReport();
}

@Get('item-ledger/:id')
itemLedger(
  @Param('id') id: string,
) {
  return this.reportsService.itemLedger(id);
}

@Get('batch-ledger/:id')
batchLedger(
  @Param('id') id: string,
) {
  return this.reportsService.batchLedger(id);
}

@Get('low-stock-report')
lowStockReport() {
  return this.reportsService.lowStockReport();
}

@Get('stock-valuation-report')
stockValuationReport() {
  return this.reportsService.stockValuationReport();
}

@Get('stock-ageing-report')
stockAgeingReport() {
  return this.reportsService.stockAgeingReport();
}
}