import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
vi.mock("./services/user.service", () => ({
  listUsers: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(),
  UserServiceError: class UserServiceError extends Error { constructor(public code: string, message: string) { super(message); } },
}));
import * as service from "./services/user.service";
import { create, deactivate, list, update } from "./controllers/user.controller";
const mocked = vi.mocked(service);
const responseMock = () => { const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); return res as unknown as Response; };
const requestMock = (overrides: Record<string, unknown> = {}) => ({ body: {}, params: {}, authUser: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true, createdAt: new Date() }, ...overrides }) as unknown as Request;
beforeEach(() => vi.resetAllMocks());
describe("user controller", () => {
  it("lists users", async () => { mocked.listUsers.mockResolvedValue([]); const res = responseMock(); await list(requestMock(), res); expect(res.status).toHaveBeenCalledWith(200); });
  it("creates a user", async () => { mocked.createUser.mockResolvedValue({ id: "u1" } as never); const res = responseMock(); await create(requestMock({ body: { name: "New User", email: "new@example.com", password: "VeryStrongPassword123!", role: "OPERATOR" } }), res); expect(res.status).toHaveBeenCalledWith(201); });
  it("rejects invalid create payload", async () => { const res = responseMock(); await create(requestMock({ body: { name: "x" } }), res); expect(res.status).toHaveBeenCalledWith(400); });
  it("maps duplicate email to 409", async () => { mocked.createUser.mockRejectedValue(new service.UserServiceError("EMAIL_TAKEN", "Duplicate")); const res = responseMock(); await create(requestMock({ body: { name: "New User", email: "new@example.com", password: "VeryStrongPassword123!", role: "OPERATOR" } }), res); expect(res.status).toHaveBeenCalledWith(409); });
  it("returns 401 when update has no authenticated user", async () => { const res = responseMock(); await update(requestMock({ authUser: undefined }), res); expect(res.status).toHaveBeenCalledWith(401); });
  it("rejects invalid update payload", async () => { const res = responseMock(); await update(requestMock({ params: { id: "u1" }, body: {} }), res); expect(res.status).toHaveBeenCalledWith(400); });
  it("updates a user", async () => { mocked.updateUser.mockResolvedValue({ id: "u1" } as never); const res = responseMock(); await update(requestMock({ params: { id: "u1" }, body: { name: "Updated User" } }), res); expect(res.status).toHaveBeenCalledWith(200); });
  it("returns 404 when user is missing", async () => { mocked.updateUser.mockRejectedValue(new service.UserServiceError("NOT_FOUND", "Missing")); const res = responseMock(); await update(requestMock({ params: { id: "u1" }, body: { name: "Updated User" } }), res); expect(res.status).toHaveBeenCalledWith(404); });
  it("returns 401 when deactivate has no authenticated user", async () => { const res = responseMock(); await deactivate(requestMock({ authUser: undefined }), res); expect(res.status).toHaveBeenCalledWith(401); });
  it("deactivates a user", async () => { mocked.updateUser.mockResolvedValue({ id: "u1", isActive: false } as never); const res = responseMock(); await deactivate(requestMock({ params: { id: "u1" } }), res); expect(res.status).toHaveBeenCalledWith(200); });
  it("maps unexpected service errors by rethrowing", async () => { mocked.createUser.mockRejectedValue(new Error("unexpected")); const res = responseMock(); await expect(create(requestMock({ body: { name: "New User", email: "new@example.com", password: "VeryStrongPassword123!", role: "OPERATOR" } }), res)).rejects.toThrow("unexpected"); });
});
