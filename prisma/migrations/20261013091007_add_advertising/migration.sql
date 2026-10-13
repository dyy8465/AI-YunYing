-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('SP', 'SB', 'SD');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('ENABLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('EXACT', 'PHRASE', 'BROAD');

-- CreateTable
CREATE TABLE "public"."AdCampaign" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."CampaignType" NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'ENABLED',
    "dailyBudget" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdMetric" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "spend" DECIMAL(12,4) NOT NULL,
    "sales" DECIMAL(12,4) NOT NULL,
    "orders" INTEGER NOT NULL,

    CONSTRAINT "AdMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdKeyword" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "matchType" "public"."MatchType" NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "spend" DECIMAL(12,4) NOT NULL,
    "sales" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "AdKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCampaign_storeId_status_idx" ON "public"."AdCampaign"("storeId", "status");

-- CreateIndex
CREATE INDEX "AdMetric_campaignId_date_idx" ON "public"."AdMetric"("campaignId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AdMetric_campaignId_date_key" ON "public"."AdMetric"("campaignId", "date");

-- CreateIndex
CREATE INDEX "AdKeyword_campaignId_idx" ON "public"."AdKeyword"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "AdKeyword_campaignId_keyword_matchType_key" ON "public"."AdKeyword"("campaignId", "keyword", "matchType");

-- AddForeignKey
ALTER TABLE "public"."AdCampaign" ADD CONSTRAINT "AdCampaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdMetric" ADD CONSTRAINT "AdMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdKeyword" ADD CONSTRAINT "AdKeyword_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
