import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authorize } from "./middlewares/authorize";

const responseMock = () => {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};
const requestFor = (role?: "ADMIN" | "MANAGER" | "OPERATOR") => ({
  authUser: role ? { id: "user-1", name: "Test", email: "test@example.invalid", role, isActive: true, createdAt: new Date() } : undefined,
}) as Request;

describe("authorize middleware", () => {
  it("returns 401 when the request is not authenticated", () => {
    const response = responseMock(); const next = vi.fn() as NextFunction;
    authorize("ADMIN")(requestFor(), response, next);
    expect(response.status).toHaveBeenCalledWith(401); expect(next).not.toHaveBeenCalled();
  });
  it("returns 403 when the role is not allowed", () => {
    const response = responseMock(); const next = vi.fn() as NextFunction;
    authorize("ADMIN", "MANAGER")(requestFor("OPERATOR"), response, next);
    expect(response.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
  });
  it("allows a role included in the policy", () => {
    const response = responseMock(); const next = vi.fn() as NextFunction;
    authorize("ADMIN", "MANAGER")(requestFor("MANAGER"), response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
