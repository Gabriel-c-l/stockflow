import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as authService from "./services/auth.service";
import { AuthServiceError } from "./services/auth.service";
import * as rateLimit from "./middlewares/login-rate-limit";
import * as sessionCookie from "./utils/session-cookie";
import { loginController, logoutController, meController } from "./controllers/auth.controller";

vi.mock("./services/auth.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/auth.service")>();
  return { ...actual, login: vi.fn(), logout: vi.fn() };
});
vi.mock("./middlewares/login-rate-limit", () => ({ resetLoginAttempts: vi.fn() }));
vi.mock("./utils/session-cookie", () => ({
  clearSessionCookie: vi.fn(),
  getSessionCookieName: vi.fn(() => "stockflow_session"),
  hashSessionToken: vi.fn((token: string) => `hashed:${token}`),
  parseCookies: vi.fn((cookie?: string) => cookie ? { stockflow_session: "session-token" } : {}),
  setSessionCookie: vi.fn(),
}));

const mockedAuth = vi.mocked(authService);
const createResponse = () => {
  const response = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  response.send.mockReturnValue(response);
  return response as unknown as Response;
};
const request = (body: unknown = {}, cookie?: string) => ({
  body,
  headers: cookie ? { cookie } : {},
}) as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe("Auth controller", () => {
  it("normalizes email, resets rate limit and sets session cookie on login", async () => {
    const result = {
      token: "raw-token",
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
      user: { id: "user-1", email: "user@example.com" },
    };
    mockedAuth.login.mockResolvedValue(result as never);
    const response = createResponse();
    await loginController(request({ email: " USER@example.com ", password: "Secret123!" }), response);
    expect(mockedAuth.login).toHaveBeenCalledWith({ email: "user@example.com", password: "Secret123!" });
    expect(rateLimit.resetLoginAttempts).toHaveBeenCalledOnce();
    expect(sessionCookie.setSessionCookie).toHaveBeenCalledWith(response, result.token, result.expiresAt);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ user: result.user });
  });

  it("rejects malformed login input", async () => {
    const response = createResponse();
    await loginController(request({ email: "not-an-email", password: "" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: "Invalid login data." });
    expect(mockedAuth.login).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid credentials", async () => {
    mockedAuth.login.mockRejectedValue(new AuthServiceError("INVALID_CREDENTIALS", "Invalid email or password."));
    const response = createResponse();
    await loginController(request({ email: "user@example.com", password: "wrong" }), response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Invalid email or password." });
  });

  it("rethrows unexpected login errors", async () => {
    const error = new Error("database unavailable");
    mockedAuth.login.mockRejectedValue(error);
    await expect(loginController(request({ email: "user@example.com", password: "secret" }), createResponse())).rejects.toBe(error);
  });

  it("logs out with a hashed session token", async () => {
    const response = createResponse();
    await logoutController(request({}, "stockflow_session=session-token"), response);
    expect(mockedAuth.logout).toHaveBeenCalledWith("hashed:session-token");
    expect(sessionCookie.clearSessionCookie).toHaveBeenCalledWith(response);
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it("logs out even when there is no session cookie", async () => {
    const response = createResponse();
    await logoutController(request(), response);
    expect(mockedAuth.logout).toHaveBeenCalledWith(undefined);
  });

  it("returns the authenticated user from /me", () => {
    const response = createResponse();
    const user = { id: "user-1", email: "user@example.com" };
    meController({ authUser: user } as unknown as Request, response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ user });
  });

  it("rejects /me when no authenticated user exists", () => {
    const response = createResponse();
    meController({} as Request, response);
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
