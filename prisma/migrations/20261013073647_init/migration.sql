-- CreateEnum
CREATE TYPE "public"."RoleCode" AS ENUM ('ADMIN', 'OWNER', 'OPERATOR', 'WAREHOUSE', 'FINANCE');

-- CreateEnum
CREATE TYPE "public"."StoreSite" AS ENUM ('US', 'EU', 'JP', 'CA');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."WarehouseType" AS ENUM ('FBA', 'OVERSEAS', 'DOMESTIC');

-- CreateEnum
CREATE TYPE "public"."InventoryStatus" AS ENUM ('NORMAL', 'LOW_STOCK', 'OUT_OF_STOCK_RISK', 'SLOW_MOVING');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('IN', 'OUT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."OrderChannel" AS ENUM ('FBA', 'FBM');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "code" "public"."RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site" "public"."StoreSite" NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "apiStatus" "public"."SyncStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "fnsku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "costPrice" DECIMAL(12,4) NOT NULL,
    "salePrice" DECIMAL(12,4) NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Listing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bullets" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "searchTerms" TEXT NOT NULL,
    "keywords" JSONB,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseType" "public"."WarehouseType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."InventoryStatus" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "type" "public"."MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amazonOrderId" TEXT NOT NULL,
    "channel" "public"."OrderChannel" NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "totalAmount" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "buyerName" TEXT NOT NULL,
    "buyerCity" TEXT,
    "itemCount" INTEGER NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfitSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,4) NOT NULL,
    "productCost" DECIMAL(12,4) NOT NULL,
    "commission" DECIMAL(12,4) NOT NULL,
    "fbaFee" DECIMAL(12,4) NOT NULL,
    "adSpend" DECIMAL(12,4) NOT NULL,
    "logisticsCost" DECIMAL(12,4) NOT NULL,
    "netProfit" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "ProfitSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "public"."Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "public"."UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_sellerId_key" ON "public"."Store"("sellerId");

-- CreateIndex
CREATE INDEX "Product_asin_idx" ON "public"."Product"("asin");

-- CreateIndex
CREATE INDEX "Product_storeId_status_idx" ON "public"."Product"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "public"."Product"("storeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_productId_key" ON "public"."Listing"("productId");

-- CreateIndex
CREATE INDEX "Listing_productId_idx" ON "public"."Listing"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_warehouseType_key" ON "public"."Inventory"("productId", "warehouseType");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryId_createdAt_idx" ON "public"."InventoryMovement"("inventoryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_amazonOrderId_key" ON "public"."Order"("amazonOrderId");

-- CreateIndex
CREATE INDEX "Order_storeId_createdAt_idx" ON "public"."Order"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "ProfitSnapshot_storeId_date_idx" ON "public"."ProfitSnapshot"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitSnapshot_productId_date_key" ON "public"."ProfitSnapshot"("productId", "date");

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfitSnapshot" ADD CONSTRAINT "ProfitSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
