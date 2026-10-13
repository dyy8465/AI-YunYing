/**
 * 模拟数据种子脚本（纯 CJS，node prisma/seed.cjs 直接运行）
 * 生成：5 角色 + 5 用户 + 2 店铺 + 30 商品 + 库存 + 90 天订单 + 30 天利润快照
 */
const { PrismaClient, StoreSite, OrderStatus, OrderChannel, WarehouseType, MovementType, CampaignType, CampaignStatus, MatchType } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

function mulberry32(seed) {
  return function () {
    let t = (seed + 0x6d2b79f5) | 0;
    seed = t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261013);
const rand = (min, max) => min + rng() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const money = (min, max) => Math.round(rand(min, max) * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

const PERMISSIONS = [
  { code: "dashboard:view", name: "查看驾驶舱", type: "MENU" },
  { code: "stores:view", name: "查看店铺", type: "MENU" },
  { code: "stores:manage", name: "管理店铺", type: "API" },
  { code: "products:view", name: "查看商品", type: "MENU" },
  { code: "products:manage", name: "管理商品", type: "API" },
  { code: "orders:view", name: "查看订单", type: "MENU" },
  { code: "orders:manage", name: "管理订单", type: "API" },
  { code: "inventory:view", name: "查看库存", type: "MENU" },
  { code: "inventory:manage", name: "管理库存", type: "API" },
  { code: "advertising:view", name: "查看广告", type: "MENU" },
  { code: "advertising:manage", name: "管理广告", type: "API" },
  { code: "finance:view", name: "查看财务", type: "MENU" },
  { code: "ai:view", name: "使用AI助手", type: "MENU" },
  { code: "users:manage", name: "管理用户", type: "MENU" },
  { code: "settings:manage", name: "系统设置", type: "API" },
];

const ROLE_MATRIX = [
  { code: "ADMIN", name: "超级管理员", description: "全部权限", permissions: PERMISSIONS.map((p) => p.code) },
  { code: "OWNER", name: "企业老板", description: "经营数据只读", permissions: ["dashboard:view", "stores:view", "products:view", "orders:view", "inventory:view", "advertising:view", "finance:view", "ai:view"] },
  { code: "OPERATOR", name: "运营人员", description: "商品/订单/广告操作", permissions: ["dashboard:view", "products:view", "products:manage", "orders:view", "orders:manage", "advertising:view", "advertising:manage", "ai:view"] },
  { code: "WAREHOUSE", name: "仓库人员", description: "库存操作", permissions: ["inventory:view", "inventory:manage"] },
  { code: "FINANCE", name: "财务人员", description: "财务与订单金额", permissions: ["dashboard:view", "orders:view", "finance:view", "ai:view"] },
];

const USERS = [
  { name: "系统管理员", email: "admin@aso.dev", role: "ADMIN" },
  { name: "王老板", email: "owner@aso.dev", role: "OWNER" },
  { name: "李运营", email: "operator@aso.dev", role: "OPERATOR" },
  { name: "张仓管", email: "warehouse@aso.dev", role: "WAREHOUSE" },
  { name: "赵财务", email: "finance@aso.dev", role: "FINANCE" },
];

const PRODUCT_NAMES = [
  "Wireless Earbuds Pro", "Smart Watch S9", "USB-C Fast Charger 65W", "Laptop Stand Aluminum",
  "Bluetooth Speaker Mini", "Phone Case iPhone 16", "Screen Protector tempered", "Ring Light 10in",
  "Desk Organizer Set", "Mechanical Keyboard 87", "Wireless Mouse Silent", "Webcam 1080P",
  "HDMI Cable 2.1 6ft", "Power Bank 20000mAh", "Car Phone Mount Magnetic", "Electric Kettle 1.7L",
  "Air Fryer 4QT", "LED Desk Lamp Clamp", "Yoga Mat 6mm", "Resistance Bands Set",
  "Water Bottle Stainless 32oz", "Travel Pillow Memory Foam", "Backpack 30L Waterproof", "Luggage Scale Digital",
  "Kitchen Scale Digital", "Coffee Mug Warmer", "Book Stand Bamboo", "Cable Management Kit",
  "Monitor Light Bar", "Laptop Sleeve 14in",
];
const CATEGORIES = ["3C数码", "家居厨房", "户外运动", "办公文具", "手机配件"];
const BRANDS = ["AnkerStyle", "HomeGlow", "TrekLite", "WorkFit", "CaseMate"];
const BUYERS = ["James Smith", "Maria Garcia", "Wei Chen", "Yuki Tanaka", "Hans Mueller", "Anna Rossi", "Ken Watanabe", "Emma Brown", "Liam Johnson", "Olivia Wilson"];
const CITIES = ["New York", "Los Angeles", "Chicago", "Tokyo", "Osaka", "Berlin", "London", "Toronto"];

const CAMPAIGN_TEMPLATES = [
  { name: "SP-Earbuds-Auto", type: "SP", keywords: ["wireless earbuds", "bluetooth earbuds", "earbuds noise cancelling"] },
  { name: "SP-Watch-Exact", type: "SP", keywords: ["smart watch", "smartwatch fitness"] },
  { name: "SB-Brand-HomeGlow", type: "SB", keywords: ["homeglow", "homeglow charger"] },
  { name: "SD-Charger-Retarget", type: "SD", keywords: ["usb c charger", "fast charger 65w"] },
  { name: "SP-Lamp-Phrase", type: "SP", keywords: ["desk lamp", "led desk lamp clamp"] },
  { name: "SP-Yoga-Broad", type: "SP", keywords: ["yoga mat", "fitness mat", "workout mat"] },
];

async function seedAdvertising(storeUS, storeJP) {
  console.log("📢 清空并生成广告数据...");
  await prisma.adKeyword.deleteMany();
  await prisma.adMetric.deleteMany();
  await prisma.adCampaign.deleteMany();

  const r4ad = (n) => Math.round(n * 10000) / 10000;
  for (let i = 0; i < CAMPAIGN_TEMPLATES.length; i++) {
    const tpl = CAMPAIGN_TEMPLATES[i];
    const store = i % 2 === 0 ? storeUS : storeJP;
    const status = i === 5 ? CampaignStatus.PAUSED : CampaignStatus.ENABLED;
    const campaign = await prisma.adCampaign.create({
      data: {
        storeId: store.id, name: tpl.name, type: tpl.type, status,
        dailyBudget: r4ad(rand(15, 80)),
      },
    });

    // 每日指标：90 天
    const today = startOfDay(new Date());
    for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
      const date = new Date(today.getTime() - daysAgo * DAY_MS);
      const base = tpl.type === "SP" ? 1 : 0.6;
      const impressions = Math.round(rand(400, 3000) * base);
      const ctr = rand(0.002, 0.008); // 0.2% - 0.8%
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const cpc = rand(0.4, 1.6);
      const spend = clicks * cpc;
      const cvr = rand(0.06, 0.18); // 转化率
      const orders = Math.max(0, Math.round(clicks * cvr));
      const aov = rand(18, 65);
      const sales = orders * aov;
      await prisma.adMetric.create({
        data: {
          campaignId: campaign.id, date,
          impressions, clicks, orders,
          spend: r4ad(spend), sales: r4ad(sales),
        },
      });
    }

    // 关键词（近 30 天聚合）
    for (const kw of tpl.keywords) {
      const impressions = randInt(1500, 9000);
      const ctr = rand(0.002, 0.01);
      const clicks = Math.max(5, Math.round(impressions * ctr));
      const spend = clicks * rand(0.4, 1.5);
      const sales = Math.round(clicks * rand(0.06, 0.2)) * rand(18, 60);
      await prisma.adKeyword.create({
        data: {
          campaignId: campaign.id,
          keyword: kw,
          matchType: pick([MatchType.EXACT, MatchType.PHRASE, MatchType.BROAD]),
          impressions, clicks, spend: r4ad(spend), sales: r4ad(sales),
        },
      });
    }
  }
  console.log("✅ 广告数据完成: 6 活动 / 540 日指标 / 15 关键词");
}

async function main() {
  if (process.env.ADS_ONLY === "1") {
    const us = await prisma.store.findFirst({ where: { site: "US" } });
    const jp = await prisma.store.findFirst({ where: { site: "JP" } });
    if (!us || !jp) throw new Error("ADS_ONLY 需要先跑完整 seed");
    await seedAdvertising(us, jp);
    return;
  }

  console.log("🌱 清空旧数据...");
  await prisma.profitSnapshot.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log("🔑 创建权限与角色...");
  const permissionMap = new Map();
  for (const p of PERMISSIONS) {
    const created = await prisma.permission.create({ data: p });
    permissionMap.set(p.code, created.id);
  }
  const roleMap = new Map();
  for (const r of ROLE_MATRIX) {
    const role = await prisma.role.create({
      data: {
        code: r.code, name: r.name, description: r.description,
        permissions: { create: r.permissions.map((code) => ({ permissionId: permissionMap.get(code) })) },
      },
    });
    roleMap.set(r.code, role.id);
  }

  console.log("👤 创建用户...");
  const passwordHash = await bcrypt.hash("Password123!", 10);
  for (const u of USERS) {
    await prisma.user.create({
      data: { name: u.name, email: u.email, passwordHash, userRoles: { create: { roleId: roleMap.get(u.role) } } },
    });
  }

  console.log("🏪 创建店铺...");
  const storeUS = await prisma.store.create({
    data: { name: "America Star Store", site: StoreSite.US, marketplaceId: "ATVPDKIKX0DER", sellerId: "A1USSELLER001", lastSyncedAt: new Date() },
  });
  const storeJP = await prisma.store.create({
    data: { name: "Japan Select Shop", site: StoreSite.JP, marketplaceId: "A1VC38T7YXB528", sellerId: "A1JPSELLER001", lastSyncedAt: new Date() },
  });

  console.log("📦 创建商品与库存...");
  const products = [];
  for (let i = 0; i < PRODUCT_NAMES.length; i++) {
    const name = PRODUCT_NAMES[i];
    const store = i % 2 === 0 ? storeUS : storeJP;
    const cost = money(6, 45);
    const sale = Math.round(cost * rand(2.2, 3.6) * 100) / 100;
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        sku: `SKU-${String(i + 1).padStart(4, "0")}`,
        asin: `B0${Math.floor(rand(1000000, 9999999))}`,
        fnsku: `X0${Math.floor(rand(1000000, 9999999))}`,
        title: name,
        category: pick(CATEGORIES),
        brand: pick(BRANDS),
        costPrice: cost,
        salePrice: sale,
        weightGrams: randInt(80, 1500),
        lengthMm: randInt(80, 350),
        widthMm: randInt(60, 250),
        heightMm: randInt(30, 180),
        listing: {
          create: {
            title: `${name} - Premium Quality with 12-Month Warranty`,
            bullets: [
              "Premium material with durable design",
              "Easy to use, setup in minutes",
              "Compatible with major devices",
              "12-month warranty and friendly support",
              "Compact size, perfect for travel",
            ],
            description: `${name} is designed for everyday use. Reliable quality, thoughtful details and excellent value.`,
            searchTerms: `${name.toLowerCase()} accessories best seller new arrival`,
            keywords: { primary: name.toLowerCase(), tags: ["best-seller", "new-arrival"] },
          },
        },
      },
    });
    products.push({ id: product.id, storeId: store.id, salePrice: sale, costPrice: cost, title: name });

    const fbaQty = pick([randInt(0, 40), randInt(30, 300), randInt(200, 900)]);
    const safety = randInt(40, 120);
    for (const [warehouseType, qty] of [
      [WarehouseType.FBA, fbaQty],
      [WarehouseType.OVERSEAS, randInt(0, 400)],
      [WarehouseType.DOMESTIC, randInt(100, 2000)],
    ]) {
      const inv = await prisma.inventory.create({
        data: {
          productId: product.id, warehouseType, quantity: qty, safetyStock: safety,
          status: qty === 0 ? "OUT_OF_STOCK_RISK" : qty < safety ? "LOW_STOCK" : "NORMAL",
        },
      });
      await prisma.inventoryMovement.create({
        data: { inventoryId: inv.id, type: MovementType.IN, quantity: qty, reference: "INIT-STOCK", note: "期初库存" },
      });
    }
  }

  console.log("🛒 生成订单（90 天）...");
  const itemAggByKey = new Map();
  const today = startOfDay(new Date());

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const day = new Date(today.getTime() - daysAgo * DAY_MS);
    const dow = day.getDay();
    const base = dow === 0 || dow === 6 ? 7 : 5;
    const orderCount = randInt(base - 2, base + 3);
    for (let o = 0; o < orderCount; o++) {
      const itemCount = randInt(1, 3);
      const chosen = new Set();
      while (chosen.size < Math.min(itemCount, 3)) chosen.add(pick(products).id);

      let total = 0;
      let qtySum = 0;
      const items = [];
      for (const pid of chosen) {
        const p = products.find((x) => x.id === pid);
        const qty = randInt(1, 3);
        const price = Math.round(p.salePrice * rand(0.95, 1.05) * 100) / 100;
        total += qty * price;
        qtySum += qty;
        items.push({ productId: pid, quantity: qty, unitPrice: price });
      }

      let status;
      const r = rng();
      if (daysAgo > 14) status = r < 0.95 ? OrderStatus.COMPLETED : OrderStatus.REFUNDED;
      else if (daysAgo > 7) status = r < 0.6 ? OrderStatus.COMPLETED : r < 0.85 ? OrderStatus.IN_TRANSIT : OrderStatus.REFUNDED;
      else if (daysAgo > 2) status = r < 0.3 ? OrderStatus.SHIPPED : r < 0.7 ? OrderStatus.IN_TRANSIT : r < 0.9 ? OrderStatus.COMPLETED : OrderStatus.PROCESSING;
      else status = r < 0.4 ? OrderStatus.PENDING : r < 0.8 ? OrderStatus.PROCESSING : OrderStatus.SHIPPED;

      const createdAt = new Date(day.getTime() + randInt(7, 22) * 3600 * 1000 + randInt(0, 59) * 60000);
      const shipped = [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.COMPLETED].includes(status);
      const firstProduct = products.find((x) => x.id === items[0].productId);

      await prisma.order.create({
        data: {
          storeId: firstProduct.storeId,
          amazonOrderId: `114-${Math.floor(rand(1000000, 9999999))}-${daysAgo}${o}`,
          channel: rng() < 0.75 ? OrderChannel.FBA : OrderChannel.FBM,
          status,
          totalAmount: Math.round(total * 100) / 100,
          buyerName: pick(BUYERS),
          buyerCity: pick(CITIES),
          itemCount: qtySum,
          shippedAt: shipped ? new Date(createdAt.getTime() + randInt(1, 48) * 3600 * 1000) : null,
          createdAt,
          items: { create: items },
        },
      });

      if ([OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.COMPLETED].includes(status) && daysAgo < 30) {
        for (const it of items) {
          const p = products.find((x) => x.id === it.productId);
          const key = `${daysAgo}|${it.productId}`;
          const cur = itemAggByKey.get(key) || { productId: it.productId, storeId: p.storeId, qty: 0, revenue: 0, cost: 0 };
          cur.qty += it.quantity;
          cur.revenue += it.quantity * it.unitPrice;
          cur.cost += it.quantity * p.costPrice;
          itemAggByKey.set(key, cur);
        }
      }
    }
  }

  console.log("💰 生成利润快照（30 天）...");
  let snapshotCount = 0;
  for (const [key, agg] of itemAggByKey.entries()) {
    const daysAgo = Number(key.split("|")[0]);
    const p = products.find((x) => x.id === agg.productId);
    const date = new Date(today.getTime() - daysAgo * DAY_MS);
    const commission = agg.revenue * 0.15;
    const fbaFee = agg.qty * rand(3.2, 5.4);
    const adSpend = agg.revenue * rand(0.08, 0.15);
    const logisticsCost = agg.cost * rand(0.10, 0.15);
    const netProfit = agg.revenue - agg.cost - commission - fbaFee - adSpend - logisticsCost;
    await prisma.profitSnapshot.create({
      data: {
        productId: agg.productId, storeId: p.storeId, date,
        revenue: r4(agg.revenue), productCost: r4(agg.cost), commission: r4(commission),
        fbaFee: r4(fbaFee), adSpend: r4(adSpend), logisticsCost: r4(logisticsCost), netProfit: r4(netProfit),
      },
    });
    snapshotCount++;
  }

  await seedAdvertising(storeUS, storeJP);

  console.log(`✅ Seed 完成: 5用户 / 2店铺 / ${products.length}商品 / ${snapshotCount}利润快照`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


