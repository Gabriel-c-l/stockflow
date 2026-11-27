import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardSummary } from "../services/dashboard.service";
import { summary } from "./dashboard.controller";

vi.mock("../services/dashboard.service", () => ({
  getDashboardSummary: vi.fn(),
}));

const mockedGetDashboardSummary = vi.mocked(getDashboardSummary);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard controller", () => {
  it("returns the dashboard summary with HTTP 200", async () => {
    const dashboard = { totalProducts: 12, totalUnits: 145 };
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    mockedGetDashboardSummary.mockResolvedValue(dashboard as never);

    await summary({} as Request, response);

    expect(mockedGetDashboardSummary).toHaveBeenCalledOnce();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(dashboard);
  });
});
