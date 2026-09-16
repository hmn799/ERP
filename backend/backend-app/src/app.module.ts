import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './modules/prisma/prisma.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { RouteModule } from './modules/route/route.module';
import { SalesmanModule } from './modules/salesman/salesman.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SalesModule } from './modules/sales/sales.module';
import { GstSlabModule } from './modules/gst-slab/gst-slab.module';
import { UnitModule } from './modules/unit/unit.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { ItemModule } from './modules/item/item.module';
import { SubCategoryModule } from './modules/sub-category/sub-category.module';
import { BatchModule } from './modules/batch/batch.module';
import { StockLedgerModule } from './modules/stock-ledger/stock-ledger.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SaleReturnModule } from './modules/sale-return/sale-return.module';
import { PurchaseReturnModule } from './modules/purchase-return/purchase-return.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { DocumentNumberModule } from './core/document-number/document-number.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PriceListModule } from './modules/price-list/price-list.module';
import { ItemPriceModule } from './modules/item-price/item-price.module';
import { PartyPriceModule } from './modules/party-price/party-price.module';
import { SchemeModule } from './modules/scheme/scheme.module';
import { AuthModule } from './modules/auth/auth.module';
import { ShortcutModule } from './modules/shortcut/shortcut.module';
import { RoleModule } from './modules/role/role.module';
import { AuditModule } from './modules/audit/audit.module';
import { BackupModule } from './modules/backup/backup.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { GlobalExceptionFilter } from './core/monitoring/global-exception.filter';
import { AnalyticsModule } from './modules/analytics/analytics.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    BackupModule,
    MonitoringModule,
    AnalyticsModule,
    SupplierModule,
    PurchaseModule,
    RouteModule,
     SalesmanModule,
     CustomerModule,
     SalesModule,
     GstSlabModule,
    UnitModule,
    CategoryModule,
    BrandModule,
    WarehouseModule,
    ItemModule,
    SubCategoryModule,
    BatchModule,
    StockLedgerModule,
    LedgerModule,
    ReportsModule,
    SaleReturnModule,
    PurchaseReturnModule,
    PurchaseOrderModule,
    DocumentNumberModule,
     SettingsModule,
     PriceListModule,
     ItemPriceModule,
     PartyPriceModule,
     SchemeModule,
     AuthModule,
     ShortcutModule,
     RoleModule,

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}