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

  // Transactions
  SALES: "/sales",
  SALES_RETURN: "/sales/returns/list",
  PURCHASE: "/purchase",
  PURCHASE_RETURN: "/purchase-return",
  PURCHASE_ORDER: "/purchase-order",

  // Inventory
  STOCK: "/inventory/stock",
  BATCH: "/inventory/batch",
  STOCK_TRANSFER: "/inventory/stock-transfer",
  STOCK_LEDGER: "/inventory/stock-ledger",

  // Accounts
  RECEIPTS: "/accounts/receipts",
  PAYMENTS: "/accounts/payments",
  LEDGER: "/accounts/ledger",
  BANK_RECONCILIATION: "/accounts/bank-reconciliation",

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
} as const;
