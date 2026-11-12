import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createApp } from "./server";

describe("GET /health", () => {
  it("returns the API health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "stockflow-api",
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});

describe("server security headers and CORS", () => {
  const configuredApp = createApp([
    "http://localhost:5173",
    "http://localhost:3000",
  ]);

  it("allows configured origins", async () => {
    const response = await request(configuredApp)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("does not authorize unconfigured origins", async () => {
    const response = await request(configuredApp)
      .get("/health")
      .set("Origin", "http://malicious.example");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests without an Origin header", async () => {
    const response = await request(configuredApp).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.service).toBe("stockflow-api");
  });

  it("does not expose the X-Powered-By header", async () => {
    const response = await request(configuredApp).get("/health");

    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
