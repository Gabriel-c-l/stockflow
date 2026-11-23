import type { RequestHandler } from "express";
import { createApp } from "./server";

const testAuthentication: RequestHandler = (request, _response, next) => {
  request.authUser = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Test Administrator",
    email: "test-admin@example.invalid",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  next();
};

const testCsrf: RequestHandler = (_request, _response, next) => next();

export const createTestApp = () =>
  createApp([], testAuthentication, testCsrf);
