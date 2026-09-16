import {
  BarChart3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "./routes";

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  permission?: string;
  badge?: string;
  disabled?: boolean;
}

export interface NavigationGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  permission?: string;
  children: NavigationItem[];
}

export const NAVIGATION: NavigationGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    defaultOpen: true,
    children: [
      {
        id: "dashboard-home",
        title: "Dashboard",
        href: ROUTES.DASHBOARD,
      },
    ],
  },

  {
    id: "masters",
    title: "Masters",
    icon: FolderTree,
    defaultOpen: true,
    children: [
      {
        id: "items",
        title: "Items",
        href: ROUTES.ITEMS,
      },
      {
        id: "customers",
        title: "Customers",
        href: ROUTES.CUSTOMERS,
      },
      {
        id: "suppliers",
        title: "Suppliers",
        href: ROUTES.SUPPLIERS,
      },
      {
        id: "categories",
        title: "Categories",
        href: ROUTES.CATEGORIES,
      },
      {
        id: "subcategories",
        title: "Sub Categories",
        href: ROUTES.SUB_CATEGORIES,
      },
      {
        id: "brands",
        title: "Brands",
        href: ROUTES.BRANDS,
      },
      {
        id: "units",
        title: "Units",
        href: ROUTES.UNITS,
      },
      {
        id: "gst",
        title: "GST Slabs",
        href: ROUTES.GST_SLABS,
      },
      {
        id: "price-lists",
        title: "Price Lists",
        href: ROUTES.PRICE_LISTS,
      },
      {
        id: "schemes",
        title: "Schemes",
        href: ROUTES.SCHEMES,
      },
      {
        id: "warehouses",
        title: "Warehouses",
        href: ROUTES.WAREHOUSES,
      },
    ],
  },

  {
    id: "transactions",
    title: "Transactions",
    icon: ShoppingCart,
    children: [
      {
        id: "sales",
        title: "Sales",
        href: ROUTES.SALES,
      },
      {
        id: "sales-return",
        title: "Sales Return",
        href: ROUTES.SALES_RETURN,
      },
      {
        id: "purchase",
        title: "Purchase",
        href: ROUTES.PURCHASE,
      },
      {
        id: "purchase-return",
        title: "Purchase Return",
        href: ROUTES.PURCHASE_RETURN,
      },
      {
        id: "purchase-order",
        title: "Purchase Order",
        href: ROUTES.PURCHASE_ORDER,
      },
    ],
  },

  {
    id: "inventory",
    title: "Inventory",
    icon: Warehouse,
    children: [
      {
        id: "stock",
        title: "Stock",
        href: ROUTES.STOCK,
      },
      {
        id: "batch",
        title: "Batch",
        href: ROUTES.BATCH,
      },
      {
        id: "stock-transfer",
        title: "Stock Transfer",
        href: ROUTES.STOCK_TRANSFER,
      },
      {
        id: "stock-ledger",
        title: "Stock Ledger",
        href: ROUTES.STOCK_LEDGER,
      },
    ],
  },

  {
    id: "accounts",
    title: "Accounts",
    icon: CreditCard,
    children: [
      {
        id: "receipts",
        title: "Receipts",
        href: ROUTES.RECEIPTS,
      },
      {
        id: "payments",
        title: "Payments",
        href: ROUTES.PAYMENTS,
      },
      {
        id: "ledger",
        title: "Ledger",
        href: ROUTES.LEDGER,
      },
    ],
  },

  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    children: [
      {
        id: "sales-report",
        title: "Sales Report",
        href: ROUTES.SALES_REPORT,
      },
      {
        id: "purchase-report",
        title: "Purchase Report",
        href: ROUTES.PURCHASE_REPORT,
      },
      {
        id: "stock-report",
        title: "Stock Report",
        href: ROUTES.STOCK_REPORT,
      },
      {
        id: "profit-report",
        title: "Profit Report",
        href: ROUTES.PROFIT_REPORT,
      },
      {
        id: "gst-report",
        title: "GST Report",
        href: ROUTES.GST_REPORT,
      },
    ],
  },

  {
    id: "administration",
    title: "Administration",
    icon: Settings,
    children: [
      {
        id: "users",
        title: "Users",
        href: ROUTES.USERS,
      },
      {
        id: "roles",
        title: "Roles",
        href: ROUTES.ROLES,
      },
      {
        id: "settings",
        title: "Settings",
        href: ROUTES.SETTINGS,
      },
      {
        id: "shortcuts",
        title: "Shortcuts",
        href: ROUTES.SHORTCUTS,
      },
      {
        id: "document-series",
        title: "Document Series",
        href: ROUTES.DOCUMENT_SERIES,
      },
    ],
  },
];