import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  loginRateLimit,
  resetLoginAttempts,
  resetLoginRateLimitForTests,
} from "./middlewares/login-rate-limit";

const makeRequest = (ip = "192.0.2.10") => ({
  ip,
  socket: { remoteAddress: "192.0.2.99" },
}) as unknown as Request;
const makeResponse = () => {
  const response = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response as unknown as Response;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-25T12:00:00.000Z"));
  resetLoginRateLimitForTests();
});
afterEach(() => {
  resetLoginRateLimitForTests();
  vi.useRealTimers();
});

describe("login rate limit", () => {
  it("allows the first five attempts", () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 5; i += 1) loginRateLimit(request, response, next);
    expect(next).toHaveBeenCalledTimes(5);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("blocks the sixth attempt and returns Retry-After", () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 5; i += 1) loginRateLimit(request, response, next);
    loginRateLimit(request, response, next);
    expect(next).toHaveBeenCalledTimes(5);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "900");
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({ error: "Too many login attempts. Try again later." });
  });

  it("allows attempts again after the window expires", () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 5; i += 1) loginRateLimit(request, response, next);
    vi.advanceTimersByTime(15 * 60 * 1000);
    loginRateLimit(request, response, next);
    expect(next).toHaveBeenCalledTimes(6);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("tracks different client IPs independently", () => {
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 5; i += 1) loginRateLimit(makeRequest("192.0.2.10"), response, next);
    loginRateLimit(makeRequest("192.0.2.11"), response, next);
    expect(next).toHaveBeenCalledTimes(6);
  });

  it("resets attempts after a successful login", () => {
    const request = makeRequest();
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 5; i += 1) loginRateLimit(request, response, next);
    resetLoginAttempts(request);
    loginRateLimit(request, response, next);
    expect(next).toHaveBeenCalledTimes(6);
    expect(response.status).not.toHaveBeenCalled();
  });

  it("uses the socket address when Express has no request IP", () => {
    const request = { ip: undefined, socket: { remoteAddress: "192.0.2.99" } } as unknown as Request;
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    loginRateLimit(request, response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
