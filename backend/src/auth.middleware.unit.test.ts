import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import * as authRepository from "./repositories/auth.repository";
import { authenticate } from "./middlewares/authenticate";

vi.mock("./repositories/auth.repository", () => ({
  findActiveSession: vi.fn(),
  findUserLanguage: vi.fn().mockResolvedValue("en"),
}));

const mockedRepository = vi.mocked(authRepository);

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

describe("Authenticate middleware unit tests", () => {
  it("denies access without a session cookie", async () => {
    const request = { headers: {} } as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await authenticate(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies a session belonging to an inactive user", async () => {
    mockedRepository.findActiveSession.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000002",
      userId: "00000000-0000-0000-0000-000000000001",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Inactive User",
        email: "inactive@example.invalid",
        passwordHash: "secret",
        role: "OPERATOR",
        language: "en",
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const request = {
      headers: { cookie: "stockflow_session=inactive-token" },
    } as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await authenticate(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts an active session", async () => {
    mockedRepository.findActiveSession.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000002",
      userId: "00000000-0000-0000-0000-000000000001",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Test User",
        email: "user@example.invalid",
        passwordHash: "secret",
        role: "OPERATOR",
        language: "en",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const request = {
      headers: { cookie: "stockflow_session=valid-token" },
    } as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await authenticate(request, response, next);

    expect(request.authUser?.email).toBe("user@example.invalid");
    expect(next).toHaveBeenCalledOnce();
  });

  it("denies an expired or revoked session", async () => {
    mockedRepository.findActiveSession.mockResolvedValue(null);

    const request = {
      headers: { cookie: "stockflow_session=expired-or-revoked" },
    } as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await authenticate(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
