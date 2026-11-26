import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./config/database";
import { getDashboardSummary } from "./services/dashboard.service";

vi.mock("./config/database", () => ({
  prisma: {
    product: { count: vi.fn(), aggregate: vi.fn() },
    category: { findMany: vi.fn() },
    stockMovement: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

const mocked = prisma as unknown as {
  product: { count: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn> };
  category: { findMany: ReturnType<typeof vi.fn> };
  stockMovement: { findMany: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};
const fixedNow = new Date("2026-11-26T14:30:00.000Z");

const recentMovements = [
  {
    id: "movement-1",
    type: "ENTRY",
    quantity: 8,
    createdAt: new Date("2026-11-26T10:00:00.000Z"),
    product: { id: "product-1", sku: "SKU-1", name: "Keyboard", unit: "UN" },
    performedBy: { id: "user-1", name: "Admin" },
  },
] as never;

const periodMovements = [
  { type: "ENTRY", quantity: 10, createdAt: new Date("2026-11-20T12:00:00.000Z") },
  { type: "EXIT", quantity: 3, createdAt: new Date("2026-11-20T13:00:00.000Z") },
  { type: "ENTRY", quantity: 4, createdAt: new Date("2026-11-22T09:00:00.000Z") },
  { type: "EXIT", quantity: 2, createdAt: new Date("2026-11-26T08:00:00.000Z") },
] as never;

const arrangeDashboardQueries = () => {
  mocked.product.count
    .mockResolvedValueOnce(12)
    .mockResolvedValueOnce(3)
    .mockResolvedValueOnce(2);
  mocked.product.aggregate.mockResolvedValue({ _sum: { quantity: 145 } } as never);
  mocked.$queryRaw.mockResolvedValue([{ count: 4n }] as never);
  mocked.category.findMany.mockResolvedValue([
    { id: "category-1", name: "Periféricos", _count: { products: 7 } },
    { id: "category-2", name: "Cabos", _count: { products: 3 } },
  ] as never);
  mocked.stockMovement.findMany
    .mockResolvedValueOnce(recentMovements)
    .mockResolvedValueOnce(periodMovements);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
  vi.clearAllMocks();
});

afterEach(() => vi.useRealTimers());

describe("Dashboard service", () => {
  it("combines active stock totals, low stock, categories and recent movements", async () => {
    arrangeDashboardQueries();

    const result = await getDashboardSummary();

    expect(result).toMatchObject({
      totalProducts: 12,
      totalUnits: 145,
      lowStockProducts: 4,
      outOfStockProducts: 3,
      uncategorizedProducts: 2,
      categoryBreakdown: [
        { id: "category-1", name: "Periféricos", productCount: 7 },
        { id: "category-2", name: "Cabos", productCount: 3 },
      ],
      recentMovements,
      periodStart: "2026-11-20T00:00:00.000Z",
    });
    expect(mocked.product.count).toHaveBeenNthCalledWith(1, { where: { isActive: true } });
    expect(mocked.product.aggregate).toHaveBeenCalledWith({
      where: { isActive: true },
      _sum: { quantity: true },
    });
    expect(mocked.product.count).toHaveBeenNthCalledWith(2, {
      where: { isActive: true, quantity: 0 },
    });
    expect(mocked.product.count).toHaveBeenNthCalledWith(3, {
      where: { isActive: true, categoryId: null },
    });
  });

  it("sums movement quantities by day and counts movement records separately", async () => {
    arrangeDashboardQueries();

    const result = await getDashboardSummary();

    expect(result.movementSummary).toEqual({
      entries: 2,
      exits: 2,
      entryQuantity: 14,
      exitQuantity: 5,
    });
    expect(result.movementSeries).toEqual([
      { date: "2026-11-20", entries: 10, exits: 3 },
      { date: "2026-11-21", entries: 0, exits: 0 },
      { date: "2026-11-22", entries: 4, exits: 0 },
      { date: "2026-11-23", entries: 0, exits: 0 },
      { date: "2026-11-24", entries: 0, exits: 0 },
      { date: "2026-11-25", entries: 0, exits: 0 },
      { date: "2026-11-26", entries: 0, exits: 2 },
    ]);
  });

  it("returns zero stock totals when the aggregate has no products", async () => {
    mocked.product.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mocked.product.aggregate.mockResolvedValue({ _sum: { quantity: null } } as never);
    mocked.$queryRaw.mockResolvedValue([] as never);
    mocked.category.findMany.mockResolvedValue([] as never);
    mocked.stockMovement.findMany.mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);

    const result = await getDashboardSummary();

    expect(result.totalProducts).toBe(0);
    expect(result.totalUnits).toBe(0);
    expect(result.lowStockProducts).toBe(0);
    expect(result.outOfStockProducts).toBe(0);
    expect(result.uncategorizedProducts).toBe(0);
    expect(result.movementSummary).toEqual({ entries: 0, exits: 0, entryQuantity: 0, exitQuantity: 0 });
    expect(result.movementSeries).toHaveLength(7);
    expect(result.movementSeries.every((day) => day.entries === 0 && day.exits === 0)).toBe(true);
  });

  it("propagates database failures instead of returning misleading dashboard data", async () => {
    const databaseError = new Error("Database unavailable");
    mocked.product.count.mockRejectedValue(databaseError);
    mocked.product.aggregate.mockResolvedValue({ _sum: { quantity: 0 } } as never);
    mocked.$queryRaw.mockResolvedValue([{ count: 0n }] as never);
    mocked.category.findMany.mockResolvedValue([] as never);
    mocked.stockMovement.findMany.mockResolvedValue([] as never);

    await expect(getDashboardSummary()).rejects.toBe(databaseError);
  });
});
