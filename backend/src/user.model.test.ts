import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./config/database";

const userEmailPrefix = "TEST-USER-MODEL-";
const productSkuPrefix = "TEST-USER-MODEL-PRODUCT-";

beforeEach(async () => {
  await prisma.stockMovement.deleteMany({
    where: { product: { sku: { startsWith: productSkuPrefix } } },
  });
  await prisma.product.deleteMany({
    where: { sku: { startsWith: productSkuPrefix } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: userEmailPrefix } },
  });
});

afterAll(async () => {
  await prisma.stockMovement.deleteMany({
    where: { product: { sku: { startsWith: productSkuPrefix } } },
  });
  await prisma.product.deleteMany({
    where: { sku: { startsWith: productSkuPrefix } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: userEmailPrefix } },
  });
  await prisma.$disconnect();
});

const createProduct = () =>
  prisma.product.create({
    data: {
      sku: `${productSkuPrefix}${crypto.randomUUID()}`,
      name: "User model test product",
    },
  });

describe("User model and StockMovement relationship", () => {
  it("creates users with the default OPERATOR role", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Test Operator",
        email: `${userEmailPrefix}${crypto.randomUUID()}@example.invalid`,
        passwordHash: "synthetic-test-hash-not-a-real-password",
      },
    });

    expect(user.role).toBe("OPERATOR");
    expect(user.isActive).toBe(true);
  });

  it("rejects duplicate user emails", async () => {
    const email = `${userEmailPrefix}DUPLICATE@example.invalid`;
    await prisma.user.create({
      data: {
        name: "First User",
        email,
        passwordHash: "synthetic-test-hash",
      },
    });

    await expect(
      prisma.user.create({
        data: {
          name: "Second User",
          email,
          passwordHash: "synthetic-test-hash",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects roles outside the UserRole enum", async () => {
    await expect(
      prisma.user.create({
        data: {
          name: "Invalid Role",
          email: `${userEmailPrefix}INVALID@example.invalid`,
          passwordHash: "synthetic-test-hash",
          role: "SUPERUSER" as never,
        },
      }),
    ).rejects.toBeDefined();
  });

  it("associates a movement with a user and preserves historical movements", async () => {
    const product = await createProduct();
    const user = await prisma.user.create({
      data: {
        name: "Movement User",
        email: `${userEmailPrefix}MOVEMENT@example.invalid`,
        passwordHash: "synthetic-test-hash",
      },
    });

    const historicalMovement = await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "ENTRY",
        quantity: 5,
      },
    });
    const attributedMovement = await prisma.stockMovement.create({
      data: {
        productId: product.id,
        performedById: user.id,
        type: "EXIT",
        quantity: 2,
      },
    });

    expect(historicalMovement.performedById).toBeNull();
    expect(attributedMovement.performedById).toBe(user.id);
  });

  it("blocks deletion of a user that has attributed movement history", async () => {
    const product = await createProduct();
    const user = await prisma.user.create({
      data: {
        name: "Protected User",
        email: `${userEmailPrefix}PROTECTED@example.invalid`,
        passwordHash: "synthetic-test-hash",
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        performedById: user.id,
        type: "ENTRY",
        quantity: 3,
      },
    });

    await expect(
      prisma.user.delete({ where: { id: user.id } }),
    ).rejects.toBeDefined();
  });
});
