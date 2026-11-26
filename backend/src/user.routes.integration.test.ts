import type { RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("./repositories/user.repository", () => ({
  listUsers: vi.fn().mockResolvedValue([{ id: "u1", name: "Demo User", email: "demo@example.com", role: "OPERATOR", isActive: true }]),
  findUserByEmail: vi.fn(), findUserById: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(),
  countActiveAdmins: vi.fn(), deactivateUserAndRevokeSessions: vi.fn(),
}));
import { createApp } from "./server";

const authByHeader: RequestHandler = (req, _res, next) => {
  const role = req.header("x-test-role");
  if (role === "ADMIN" || role === "MANAGER" || role === "OPERATOR") {
    req.authUser = { id: "test-user", name: "Test User", email: "test@example.com", role, isActive: true, createdAt: new Date() };
  }
  next();
};
const passCsrf: RequestHandler = (_req, _res, next) => next();
const app = createApp([], authByHeader, passCsrf);

describe("Users API authorization", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/users");
    expect(response.status).toBe(401);
  });
  it("allows administrators to list users", async () => {
    const response = await request(app).get("/users").set("x-test-role", "ADMIN");
    expect(response.status).toBe(200);
    expect(response.body.users[0]).not.toHaveProperty("passwordHash");
  });
  it.each(["MANAGER", "OPERATOR"]) ("denies %s access to user administration", async (role) => {
    const response = await request(app).get("/users").set("x-test-role", role);
    expect(response.status).toBe(403);
  });
});
