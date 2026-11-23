import { describe, expect, it, vi } from "vitest";
import { bootstrapAdmin } from "./services/bootstrap-admin.service";

describe("Bootstrap admin unit tests", () => {
  it("creates the first administrator", async () => {
    let adminExists = false;
    const transaction = {
      $executeRaw: vi.fn(),
      user: {
        findFirst: vi.fn(async () =>
          adminExists ? { id: "admin", email: "admin@example.invalid" } : null,
        ),
        create: vi.fn(async () => {
          adminExists = true;
          return { id: "admin", email: "admin@example.invalid" };
        }),
      },
    };
    const database = {
      $transaction: vi.fn(async (callback) => callback(transaction)),
    };

    const result = await bootstrapAdmin(database as never, {
      name: "Administrator",
      email: "admin@example.invalid",
      password: "StrongPassword123!",
    });

    expect(result.created).toBe(true);
    expect(transaction.user.create).toHaveBeenCalledOnce();
  });

  it("does not create another administrator", async () => {
    const transaction = {
      $executeRaw: vi.fn(),
      user: {
        findFirst: vi.fn(async () => ({
          id: "existing-admin",
          email: "existing@example.invalid",
        })),
        create: vi.fn(),
      },
    };
    const database = {
      $transaction: vi.fn(async (callback) => callback(transaction)),
    };

    const result = await bootstrapAdmin(database as never, {
      name: "Another Administrator",
      email: "another@example.invalid",
      password: "StrongPassword123!",
    });

    expect(result.created).toBe(false);
    expect(transaction.user.create).not.toHaveBeenCalled();
  });

  it("uses one transaction for concurrent bootstrap attempts", async () => {
    let adminExists = false;
    const transaction = {
      $executeRaw: vi.fn(),
      user: {
        findFirst: vi.fn(async () =>
          adminExists ? { id: "admin", email: "admin@example.invalid" } : null,
        ),
        create: vi.fn(async () => {
          adminExists = true;
          return { id: "admin", email: "admin@example.invalid" };
        }),
      },
    };
    const database = {
      $transaction: vi.fn(async (callback) => callback(transaction)),
    };
    const input = {
      name: "Administrator",
      email: "admin@example.invalid",
      password: "StrongPassword123!",
    };

    const results = await Promise.all([
      bootstrapAdmin(database as never, input),
      bootstrapAdmin(database as never, input),
    ]);

    expect(results.filter((result) => result.created)).toHaveLength(1);
  });
});
