import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./server";

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
