import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { csrfProtection } from "./middlewares/csrf";
import {
  clearSessionCookie,
  getSessionTtlHours,
  parseCookies,
  setSessionCookie,
} from "./utils/session-cookie";
import { verifyPassword } from "./utils/password";
import { loginRateLimit, resetLoginRateLimitForTests } from "./middlewares/login-rate-limit";

const responseStub = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

describe("Authentication security unit tests", () => {
  it("allows state-changing requests from a configured Origin", () => {
    vi.stubEnv("CORS_ORIGINS", "http://localhost:5173");
    const request = {
      method: "POST",
      headers: { origin: "http://localhost:5173" },
    } as Request;
    const response = responseStub();
    const next = vi.fn() as NextFunction;

    csrfProtection(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });

  it("accepts a configured Referer and rejects an invalid Referer", () => {
    vi.stubEnv("CORS_ORIGINS", "http://localhost:5173");
    const allowedRequest = {
      method: "POST",
      headers: { referer: "http://localhost:5173/page" },
    } as Request;
    const deniedRequest = {
      method: "POST",
      headers: { referer: "http://malicious.example/page" },
    } as Request;
    const allowedResponse = responseStub();
    const deniedResponse = responseStub();
    const next = vi.fn() as NextFunction;

    csrfProtection(allowedRequest, allowedResponse, next);
    csrfProtection(deniedRequest, deniedResponse, next);

    expect(next).toHaveBeenCalledOnce();
    expect(deniedResponse.status).toHaveBeenCalledWith(403);
    vi.unstubAllEnvs();
  });

  it("rejects state-changing requests from an unconfigured Origin", () => {
    vi.stubEnv("CORS_ORIGINS", "http://localhost:5173");
    const request = {
      method: "POST",
      headers: { origin: "http://malicious.example" },
    } as Request;
    const response = responseStub();
    const next = vi.fn() as NextFunction;

    csrfProtection(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("allows safe methods but rejects unsafe requests without Origin or Referer", () => {
    vi.stubEnv("CORS_ORIGINS", "");
    const safeRequest = {
      method: "GET",
      headers: {},
    } as Request;
    const unsafeRequest = {
      method: "DELETE",
      headers: {},
    } as Request;
    const next = vi.fn() as NextFunction;

    csrfProtection(safeRequest, responseStub(), next);
    csrfProtection(unsafeRequest, responseStub(), next);

    expect(next).toHaveBeenCalledOnce();
    const deniedResponse = responseStub();
    csrfProtection(unsafeRequest, deniedResponse, next);
    expect(deniedResponse.status).toHaveBeenCalledWith(403);
    vi.unstubAllEnvs();
  });

  it("parses cookies and applies session cookie security options", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_NAME", "test_session");

    expect(parseCookies("test_session=token%20value; other=value")).toEqual({
      test_session: "token value",
      other: "value",
    });

    const response = responseStub();
    setSessionCookie(response, "test-token", new Date(Date.now() + 60_000));

    expect(response.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringMatching(/HttpOnly.*SameSite=Lax.*Secure/),
    );

    clearSessionCookie(response);
    expect(response.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringMatching(/Max-Age=0.*Expires=/),
    );
    vi.unstubAllEnvs();
  });

  it("uses a valid positive session TTL and rejects malformed TTL values", () => {
    vi.stubEnv("SESSION_TTL_HOURS", "48");
    expect(getSessionTtlHours()).toBe(48);

    vi.stubEnv("SESSION_TTL_HOURS", "invalid");
    expect(getSessionTtlHours()).toBe(24);

    vi.stubEnv("SESSION_TTL_HOURS", "9999");
    expect(getSessionTtlHours()).toBe(24);
    vi.unstubAllEnvs();
  });

  it("blocks repeated login attempts from the same client", () => {
    resetLoginRateLimitForTests();
    const request = { ip: "192.0.2.10", socket: {} } as Request;
    const next = vi.fn() as NextFunction;
    const blockedResponse = responseStub();

    for (let index = 0; index < 5; index += 1) {
      loginRateLimit(request, responseStub(), next);
    }
    loginRateLimit(request, blockedResponse, next);

    expect(blockedResponse.status).toHaveBeenCalledWith(429);
    expect(blockedResponse.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
    resetLoginRateLimitForTests();
  });

  it("rejects malformed password hash encodings", async () => {
    await expect(
      verifyPassword("password", "plain-text-or-invalid-format"),
    ).resolves.toBe(false);
  });
});
