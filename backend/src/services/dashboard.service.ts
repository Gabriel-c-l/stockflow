import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma/client";

const getUtcDay = (date: Date) => date.toISOString().slice(0, 10);

export const getDashboardSummary = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const [totalProducts, stockTotals, lowStockProducts, outOfStockProducts, categories, recentMovements, periodMovements] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.aggregate({ where: { isActive: true }, _sum: { quantity: true } }),
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Product" WHERE "isActive" = true AND quantity > 0 AND quantity <= "minStock"`),
    prisma.product.count({ where: { isActive: true, quantity: 0 } }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" }, take: 6,
      include: { product: { select: { id: true, sku: true, name: true, unit: true } }, performedBy: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { type: true, quantity: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const lowStockCount = Number(lowStockProducts[0]?.count ?? 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setUTCDate(day.getUTCDate() + index);
    return { date: getUtcDay(day), entries: 0, exits: 0 };
  });
  for (const movement of periodMovements) {
    const day = days.find((item) => item.date === getUtcDay(movement.createdAt));
    if (!day) continue;
    if (movement.type === "ENTRY") day.entries += movement.quantity;
    else day.exits += movement.quantity;
  }

  const entries = periodMovements.filter((item) => item.type === "ENTRY");
  const exits = periodMovements.filter((item) => item.type === "EXIT");

  return {
    totalProducts,
    totalUnits: stockTotals._sum.quantity ?? 0,
    lowStockProducts: lowStockCount,
    outOfStockProducts,
    movementSummary: {
      entries: entries.length, exits: exits.length,
      entryQuantity: entries.reduce((sum, item) => sum + item.quantity, 0),
      exitQuantity: exits.reduce((sum, item) => sum + item.quantity, 0),
    },
    movementSeries: days,
    categoryBreakdown: categories.map((category) => ({ id: category.id, name: category.name, productCount: category._count.products })),
    uncategorizedProducts: await prisma.product.count({ where: { isActive: true, categoryId: null } }),
    recentMovements,
    periodStart: sevenDaysAgo.toISOString(),
  };
};
