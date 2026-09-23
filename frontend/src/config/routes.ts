export const ROUTES = {
  DASHBOARD: "/dashboard",

  // Masters
  ITEMS: "/masters/items",
  CUSTOMERS: "/masters/customers",
  SUPPLIERS: "/masters/suppliers",
  CATEGORIES: "/masters/categories",
  SUB_CATEGORIES: "/masters/sub-categories",
  BRANDS: "/masters/brands",
  UNITS: "/masters/units",
  GST_SLABS: "/masters/gst-slabs",
  PRICE_LISTS: "/masters/price-lists",
  SCHEMES: "/masters/schemes",
  WAREHOUSES: "/masters/warehouses",
  ACCOUNT_GROUPS: "/masters/account-groups",

  // Transactions
  SALES: "/sales",
  SALES_RETURN: "/sales/returns/list",
  PURCHASE: "/purchase",
  PURCHASE_RETURN: "/purchase-return",
  PURCHASE_ORDER: "/purchase-order",
  SALES_ORDER: "/sales-order",

  // Inventory - Stock/Batch/Stock Ledger are tabs of the same
  // report page (frontend/src/features/reports/stock), not separate
  // pages, so they're routed there with a `tab` query param.
  STOCK: "/reports/stock?tab=current",
  BATCH: "/reports/stock?tab=batch",
  STOCK_TRANSFER: "/inventory/stock-transfer",
  STOCK_LEDGER: "/reports/stock?tab=movement",
  OPENING_STOCK: "/inventory/opening-stock",
  OPENING_STOCK_BULK: "/inventory/opening-stock/bulk",
  LABEL_PRINT: "/inventory/label-print",
  DAMAGE_STOCK: "/inventory/damage-stock",

  // Accounts
  RECEIPTS: "/accounts/receipts",
  PAYMENTS: "/accounts/payments",
  LEDGER: "/accounts/ledger",
  CASH_BOOK: "/accounts/cash-book",
  CARD_BOOK: "/accounts/card-book",
  UPI_BOOK: "/accounts/upi-book",
  BANK_BOOK: "/accounts/bank-book",
  BANK_RECONCILIATION: "/accounts/bank-reconciliation",
  DEBIT_NOTES: "/accounts/debit-notes",
  CREDIT_NOTES: "/accounts/credit-notes",

  // Reports
  SALES_REPORT: "/reports/sales",
  PURCHASE_REPORT: "/reports/purchase",
  STOCK_REPORT: "/reports/stock",
  PROFIT_REPORT: "/reports/profit",
  GST_REPORT: "/reports/gst",
  ANALYTICS: "/reports/analytics",
  DASHBOARD_REPORT: "/reports/dashboard",

  // Administration
  USERS: "/admin/users",
  ROLES: "/admin/roles",
  SETTINGS: "/admin/settings",
  SHORTCUTS: "/admin/shortcuts",
  AUDIT_LOG: "/admin/audit-log",
  BACKUPS: "/admin/backups",
  MONITORING: "/admin/monitoring",
  BANK_ACCOUNTS: "/admin/bank-accounts",
  DOCUMENT_SERIES: "/admin/document-series",
  FINANCIAL_YEARS: "/admin/financial-years",
} as const;
