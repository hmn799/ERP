import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting ERP Seed...");

  // ==========================
  // Roles
  // ==========================

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
    },
  });

  await prisma.role.upsert({
    where: { name: "Staff" },
    update: {},
    create: {
      name: "Staff",
    },
  });

  // ==========================
  // Permissions
  // ==========================

  const permissions = [
    "CREATE_SALE",
    "EDIT_SALE",
    "DELETE_SALE",

    "CREATE_PURCHASE",
    "EDIT_PURCHASE",
    "DELETE_PURCHASE",

    "VIEW_PROFIT",
    "CHANGE_RATE",
    "APPLY_DISCOUNT",
    "MANAGE_USERS",
    "MANAGE_SETTINGS",
    "VIEW_AUDIT_LOG",
    "MANAGE_BACKUPS",
    "VIEW_MONITORING",
    "MANAGE_BANK_RECONCILIATION",
    "MANAGE_BATCH_BARCODES",
  ];

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code,
      },
    });
  }

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // ==========================
  // Admin User
  // ==========================

  const passwordHash = await bcrypt.hash(
    "admin123",
    10,
  );

  await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      fullName: "System Administrator",
      roleId: adminRole.id,
    },
  });

  // ==========================
  // Document Series
  // ==========================

  const series = [
  ["PB", "Purchase Bill"],
  ["SB", "Sales Bill"],
  ["PO", "Purchase Order"],
  ["SO", "Sales Order"],
  ["PR", "Purchase Return"],
  ["SR", "Sales Return"],
  ["ST", "Stock Transfer"],
  ["BATCH", "Batch Number"],
] as const;

  for (const [documentType, name] of series) {
    await prisma.documentSeries.upsert({
      where: {
        documentType,
      },
      update: {},
      create: {
        documentType,
        name,
        prefix: documentType,
        suffix: null,
        padding: 6,
        currentNumber: 0,
        resetYearly: false,
        financialYear: null,
        isActive: true,
      },
    });
  }

  // ==========================
  // Shortcut Registry
  // ==========================

  const shortcuts = [
    ["NEW_BILL", "New Bill", "Billing", "F8"],
    ["HOLD_BILL", "Hold Bill", "Billing", "F6"],
    ["RECALL_BILL", "Recall Bill", "Billing", "F7"],
    ["SAVE_BILL", "Save Bill", "Billing", "F12"],
    ["MODIFY_BILL", "Modify Bill", "Billing", "Ctrl+M"],
    ["SALE_RETURN", "Sale Return", "Billing", "Ctrl+R"],
    ["BATCH_SELECTION", "Batch Selection", "Billing", "Ctrl+B"],
    ["ITEM_INFO", "Item Info", "Billing", "Ctrl+I"],
    ["PURCHASE", "Purchase / Stock Receive", "Transactions", "F9"],
    ["RECEIPT_PAYMENT", "Receipt / Payment", "Accounts", "F10"],
    ["LEDGER", "Ledger Open", "Accounts", "F11"],
    ["OUTSTANDING", "Outstanding", "Accounts", "Ctrl+O"],
    ["DEBIT_NOTE", "Debit Note", "Accounts", "Ctrl+D"],
    ["REPORTS", "Reports", "Reports", "Ctrl+Alt+R"],
  ] as const;

  for (const [
    actionCode,
    label,
    category,
    defaultKey,
  ] of shortcuts) {
    await prisma.shortcut.upsert({
      where: { actionCode },
      update: {},
      create: {
        actionCode,
        label,
        category,
        defaultKey,
        currentKey: defaultKey,
        isEnabled: true,
      },
    });
  }

  console.log("ERP Seed Completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });