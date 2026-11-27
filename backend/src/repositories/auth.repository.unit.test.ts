import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../config/database";
import {
  createSession,
  findActiveSession,
  findUserByEmail,
  findUserById,
  findUserLanguage,
  revokeSession,
  revokeSessionByTokenHash,
  updateUserLanguage,
} from "./auth.repository";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindFirst: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionUpdateMany: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    session: {
      create: mocks.sessionCreate,
      findFirst: mocks.sessionFindFirst,
      update: mocks.sessionUpdate,
      updateMany: mocks.sessionUpdateMany,
    },
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
  },
}));

const db = vi.mocked(prisma);
const userId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";
const tokenHash = "synthetic-token-hash";
const now = new Date("2026-11-27T12:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth repository", () => {
  it("finds a user by email", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: userId });

    await findUserByEmail("person@example.invalid");

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "person@example.invalid" },
    });
  });

  it("finds a user by ID", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: userId });

    await findUserById(userId);

    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it("creates a session with the user, token hash and expiration", async () => {
    const expiresAt = new Date("2026-12-04T12:00:00.000Z");
    mocks.sessionCreate.mockResolvedValue({ id: sessionId });

    await createSession(userId, tokenHash, expiresAt);

    expect(db.session.create).toHaveBeenCalledWith({
      data: { userId, tokenHash, expiresAt },
    });
  });

  it("finds only a non-revoked session that has not expired", async () => {
    mocks.sessionFindFirst.mockResolvedValue({ id: sessionId });

    await findActiveSession(tokenHash, now);

    expect(db.session.findFirst).toHaveBeenCalledWith({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      include: { user: true },
    });
  });

  it("revokes a session by its ID", async () => {
    mocks.sessionUpdate.mockResolvedValue({ id: sessionId, revokedAt: now });

    await revokeSession(sessionId, now);

    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: { revokedAt: now },
    });
  });

  it("revokes all active sessions matching a token hash", async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });

    await revokeSessionByTokenHash(tokenHash, now);

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  });

  it("returns the Brazilian Portuguese preference when it is stored", async () => {
    mocks.queryRaw.mockResolvedValue([{ language: "pt-BR" }]);

    await expect(findUserLanguage(userId)).resolves.toBe("pt-BR");
    expect(db.$queryRaw).toHaveBeenCalledOnce();
    expect(mocks.queryRaw.mock.calls[0]?.[1]).toBe(userId);
  });

  it("falls back to English when no supported preference is stored", async () => {
    mocks.queryRaw.mockResolvedValue([{ language: "fr" }]);

    await expect(findUserLanguage(userId)).resolves.toBe("en");
  });

  it("updates the language preference and returns the persisted value", async () => {
    mocks.executeRaw.mockResolvedValue(1);
    mocks.queryRaw.mockResolvedValue([{ language: "pt-BR" }]);

    await expect(updateUserLanguage(userId, "pt-BR")).resolves.toEqual({
      language: "pt-BR",
    });

    expect(db.$executeRaw).toHaveBeenCalledOnce();
    // Tagged-template substitutions follow SQL placeholder order:
    // language is $1 and userId is $2.
    expect(mocks.executeRaw.mock.calls[0]?.[1]).toBe("pt-BR");
    expect(mocks.executeRaw.mock.calls[0]?.[2]).toBe(userId);
  });
});
