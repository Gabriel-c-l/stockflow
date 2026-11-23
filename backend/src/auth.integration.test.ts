import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./server";
import { resetLoginRateLimitForTests } from "./middlewares/login-rate-limit";

const app = createApp(["http://localhost:5173"]);

vi.mock("./repositories/auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createSession: vi.fn(),
  findActiveSession: vi.fn(),
  revokeSession: vi.fn(),
  revokeSessionByTokenHash: vi.fn(),
}));

vi.mock("./utils/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("synthetic-dummy-hash"),
  verifyPassword: vi.fn(),
}));

import * as authRepository from "./repositories/auth.repository";
import { verifyPassword } from "./utils/password";

const mockedRepository = vi.mocked(authRepository);
const mockedVerifyPassword = vi.mocked(verifyPassword);

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test User",
  email: "user@example.invalid",
  passwordHash: "hash",
  role: "OPERATOR" as const,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Authentication HTTP integration tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetLoginRateLimitForTests();
  });

  it("logs in and sets an HttpOnly session cookie", async () => {
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

    const response = await request(app)
      .post("/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: user.email, password: "CorrectPassword123!" });

    expect(response.status).toBe(200);
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(String(response.headers["set-cookie"])).toContain("HttpOnly");
  });

  it("rejects login requests without a valid Origin before checking credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: "CorrectPassword123!" });

    expect(response.status).toBe(403);
    expect(mockedRepository.findUserByEmail).not.toHaveBeenCalled();
  });

  it("rejects invalid credentials generically", async () => {
    mockedRepository.findUserByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post("/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "missing@example.invalid", password: "AnyPassword" });

    expect(response.status).toBe(401);
  });

  it("rejects access to /auth/me without a session", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
  });

  it("returns /auth/me only with an active session", async () => {
    mockedRepository.findActiveSession.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000002",
      userId: user.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      user,
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Cookie", "stockflow_session=valid-token");

    expect(response.status).toBe(200);
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("logs out and clears the session cookie", async () => {
    mockedRepository.findActiveSession.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000002",
      userId: user.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      user,
    });
    mockedRepository.revokeSessionByTokenHash.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .post("/auth/logout")
      .set("Origin", "http://localhost:5173")
      .set("Cookie", "stockflow_session=valid-token");

    expect(response.status).toBe(204);
    expect(String(response.headers["set-cookie"])).toContain("Max-Age=0");
  });
});
