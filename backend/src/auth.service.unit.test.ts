import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authRepository from "./repositories/auth.repository";
import { login, logout } from "./services/auth.service";

vi.mock("./repositories/auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createSession: vi.fn(),
  findActiveSession: vi.fn(),
  revokeSession: vi.fn(),
  revokeSessionByTokenHash: vi.fn(),
}));

vi.mock("./utils/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { hashPassword, verifyPassword } from "./utils/password";

const mockedRepository = vi.mocked(authRepository);
const mockedVerifyPassword = vi.mocked(verifyPassword);

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test User",
  email: "user@example.invalid",
  passwordHash: "argon2id$synthetic",
  role: "OPERATOR" as const,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("AuthService unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("logs in a valid active user and creates a session", async () => {
    mockedRepository.findUserByEmail.mockResolvedValue(user);
    mockedVerifyPassword.mockResolvedValue(true);
    mockedRepository.createSession.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000002",
      userId: user.id,
      tokenHash: "hash",
      expiresAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
    });

    const result = await login({
      email: user.email,
      password: "CorrectPassword123!",
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(mockedRepository.createSession).toHaveBeenCalledOnce();
  });

  it("rejects an invalid password with a generic credentials error", async () => {
    mockedRepository.findUserByEmail.mockResolvedValue(user);
    mockedVerifyPassword.mockResolvedValue(false);

    await expect(
      login({ email: user.email, password: "WrongPassword123!" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });

  it("does not reveal whether the email exists", async () => {
    mockedRepository.findUserByEmail.mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("synthetic-dummy-hash");

    await expect(
      login({ email: "missing@example.invalid", password: "AnyPassword" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
    expect(hashPassword).toHaveBeenCalledWith("AnyPassword");
  });

  it("rejects a deactivated account with the same generic response", async () => {
    mockedRepository.findUserByEmail.mockResolvedValue({
      ...user,
      isActive: false,
    });
    mockedVerifyPassword.mockResolvedValue(true);

    await expect(
      login({ email: user.email, password: "CorrectPassword123!" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });

  it("revokes a session on logout", async () => {
    mockedRepository.revokeSessionByTokenHash.mockResolvedValue({
      count: 1,
    });

    await logout("synthetic-token-hash");

    expect(
      mockedRepository.revokeSessionByTokenHash,
    ).toHaveBeenCalledWith("synthetic-token-hash", expect.any(Date));
  });
});
