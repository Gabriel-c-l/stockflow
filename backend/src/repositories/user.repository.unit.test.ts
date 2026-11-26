import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../config/database";
import {
  countActiveAdmins,
  createUser,
  deactivateUserAndRevokeSessions,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
} from "./user.repository";

const mocks = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userCount: vi.fn(),
  sessionUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    user: {
      findMany: mocks.userFindMany,
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
      update: mocks.userUpdate,
      count: mocks.userCount,
    },
    session: {
      updateMany: mocks.sessionUpdateMany,
    },
    $transaction: mocks.transaction,
  },
}));

const db = vi.mocked(prisma);
const userId = "00000000-0000-4000-8000-000000000001";
const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("User repository", () => {
  it("lists users with only public fields and the expected ordering", async () => {
    mocks.userFindMany.mockResolvedValue([]);
    await listUsers();

    expect(db.user.findMany).toHaveBeenCalledWith({
      select: publicSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
  });

  it("finds a user by ID", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: userId });
    await findUserById(userId);

    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it("finds a user by email", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: userId });
    await findUserByEmail("person@example.com");

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "person@example.com" },
    });
  });

  it("creates a user with the supplied password hash and public response fields", async () => {
    mocks.userCreate.mockResolvedValue({ id: userId });
    await createUser(
      { name: "New User", email: "new@example.com", password: "a-secure-password", role: "MANAGER" },
      "argon2id-hash",
    );

    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "New User",
        email: "new@example.com",
        passwordHash: "argon2id-hash",
        role: "MANAGER",
      },
      select: publicSelect,
    });
  });

  it("updates all supplied fields", async () => {
    mocks.userUpdate.mockResolvedValue({ id: userId });
    await updateUser(userId, {
      name: "Updated User",
      email: "updated@example.com",
      role: "OPERATOR",
      isActive: false,
    });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        name: "Updated User",
        email: "updated@example.com",
        role: "OPERATOR",
        isActive: false,
      },
      select: publicSelect,
    });
  });

  it("omits fields that are undefined from a partial update", async () => {
    mocks.userUpdate.mockResolvedValue({ id: userId });
    await updateUser(userId, { role: "MANAGER" });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { role: "MANAGER" },
      select: publicSelect,
    });
  });

  it("counts only active administrators", async () => {
    mocks.userCount.mockResolvedValue(2);
    await countActiveAdmins();

    expect(db.user.count).toHaveBeenCalledWith({
      where: { role: "ADMIN", isActive: true },
    });
  });

  it("deactivates a user and revokes only sessions that are not already revoked in one transaction", async () => {
    const deactivatedUser = { id: userId, isActive: false };
    const tx = {
      user: { update: vi.fn().mockResolvedValue(deactivatedUser) },
      session: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
    };
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    );

    const result = await deactivateUserAndRevokeSessions(userId);

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { isActive: false },
      select: publicSelect,
    });
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: { userId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toBe(deactivatedUser);
  });

  it("propagates transaction errors", async () => {
    const error = new Error("transaction failed");
    mocks.transaction.mockRejectedValue(error);

    await expect(deactivateUserAndRevokeSessions(userId)).rejects.toBe(error);
  });
});
