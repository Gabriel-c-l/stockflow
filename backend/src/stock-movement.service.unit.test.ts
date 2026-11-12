import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./config/database";
import * as stockMovementRepository from "./repositories/stock-movement.repository";
import {
  createStockMovement,
  listProductMovements,
  StockMovementServiceError,
} from "./services/stock-movement.service";
import { createStockMovementSchema } from "./types/stock-movement";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("./config/database", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("./repositories/stock-movement.repository", () => ({
  createStockMovement: vi.fn(),
  decreaseProductQuantity: vi.fn(),
  findMovementsByProductId: vi.fn(),
  findProductById: vi.fn(),
  findProductForHistory: vi.fn(),
  increaseProductQuantity: vi.fn(),
}));

const mockedPrisma = vi.mocked(prisma);
const mockedStockMovementRepository = vi.mocked(stockMovementRepository);

const productId = "00000000-0000-0000-0000-000000000001";
const movementInput = {
  productId,
  type: "ENTRY" as const,
  quantity: 5,
};
const movement = {
  id: "00000000-0000-0000-0000-000000000002",
  ...movementInput,
  notes: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};
const transactionClient = {};

describe("StockMovementService unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedPrisma.$transaction.mockImplementation(async (callback) =>
      callback(transactionClient as never),
    );
  });

  it("registers an ENTRY in a transaction", async () => {
    mockedStockMovementRepository.findProductById.mockResolvedValue({
      id: productId,
    });
    mockedStockMovementRepository.createStockMovement.mockResolvedValue(
      movement,
    );

    await expect(createStockMovement(movementInput)).resolves.toEqual(movement);
    expect(
      mockedStockMovementRepository.increaseProductQuantity,
    ).toHaveBeenCalledWith(transactionClient, productId, 5);
    expect(
      mockedStockMovementRepository.createStockMovement,
    ).toHaveBeenCalledWith(transactionClient, movementInput);
  });

  it("registers an EXIT when stock is sufficient", async () => {
    const input = { ...movementInput, type: "EXIT" as const };
    mockedStockMovementRepository.findProductById.mockResolvedValue({
      id: productId,
    });
    mockedStockMovementRepository.decreaseProductQuantity.mockResolvedValue({
      count: 1,
    });
    mockedStockMovementRepository.createStockMovement.mockResolvedValue({
      ...movement,
      ...input,
    });

    await expect(createStockMovement(input)).resolves.toMatchObject(input);
    expect(
      mockedStockMovementRepository.decreaseProductQuantity,
    ).toHaveBeenCalledWith(transactionClient, productId, 5);
  });

  it("raises INSUFFICIENT_STOCK and does not create a movement", async () => {
    const input = { ...movementInput, type: "EXIT" as const };
    mockedStockMovementRepository.findProductById.mockResolvedValue({
      id: productId,
    });
    mockedStockMovementRepository.decreaseProductQuantity.mockResolvedValue({
      count: 0,
    });

    await expect(createStockMovement(input)).rejects.toEqual(
      new StockMovementServiceError("INSUFFICIENT_STOCK", "Insufficient stock."),
    );
    expect(
      mockedStockMovementRepository.createStockMovement,
    ).not.toHaveBeenCalled();
  });

  it("rejects invalid quantity in the movement schema", () => {
    expect(() =>
      createStockMovementSchema.parse({
        ...movementInput,
        quantity: 0,
      }),
    ).toThrow();
    expect(() =>
      createStockMovementSchema.parse({
        ...movementInput,
        quantity: -1,
      }),
    ).toThrow();
    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("raises NOT_FOUND when the product does not exist", async () => {
    mockedStockMovementRepository.findProductById.mockResolvedValue(null);

    await expect(createStockMovement(movementInput)).rejects.toEqual(
      new StockMovementServiceError("NOT_FOUND", "Product not found."),
    );
    expect(
      mockedStockMovementRepository.createStockMovement,
    ).not.toHaveBeenCalled();
  });

  it("lists product movements after confirming the product exists", async () => {
    mockedStockMovementRepository.findProductForHistory.mockResolvedValue({
      id: productId,
    });
    mockedStockMovementRepository.findMovementsByProductId.mockResolvedValue([
      movement,
    ]);

    await expect(listProductMovements(productId)).resolves.toEqual([movement]);
    expect(
      mockedStockMovementRepository.findMovementsByProductId,
    ).toHaveBeenCalledWith(productId);
  });
});
