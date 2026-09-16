-- CreateTable
CREATE TABLE "Shortcut" (
    "id" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "defaultKey" TEXT NOT NULL,
    "currentKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shortcut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleShortcut" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "shortcutId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleShortcut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shortcut_actionCode_key" ON "Shortcut"("actionCode");

-- CreateIndex
CREATE INDEX "Shortcut_isEnabled_idx" ON "Shortcut"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "RoleShortcut_roleId_shortcutId_key" ON "RoleShortcut"("roleId", "shortcutId");

-- AddForeignKey
ALTER TABLE "RoleShortcut" ADD CONSTRAINT "RoleShortcut_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleShortcut" ADD CONSTRAINT "RoleShortcut_shortcutId_fkey" FOREIGN KEY ("shortcutId") REFERENCES "Shortcut"("id") ON DELETE CASCADE ON UPDATE CASCADE;
