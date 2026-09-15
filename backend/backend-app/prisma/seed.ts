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
    "MANAGE_USERS",
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