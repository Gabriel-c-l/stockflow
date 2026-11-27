import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPerformanceDatabase,
  getCliArgument,
  getPerformanceDatabaseUrl,
} from "./performance-safety";

const originalArgv = [...process.argv];
const localUrl = "postgresql://perf:local-only@127.0.0.1:5432/stockflow_perf";

beforeEach(() => {
  process.argv.splice(0, process.argv.length, ...originalArgv);
  vi.stubEnv("PERF_DATABASE_URL", localUrl);
  vi.stubEnv("DATABASE_URL", localUrl);
});

afterEach(() => {
  process.argv.splice(0, process.argv.length, ...originalArgv);
  vi.unstubAllEnvs();
});

describe("Performance test safety helpers", () => {
  it("accepts only a matching local stockflow_perf PostgreSQL URL", () => {
    expect(getPerformanceDatabaseUrl()).toBe(localUrl);
  });

  it("requires PERF_DATABASE_URL to be explicitly configured", () => {
    delete process.env.PERF_DATABASE_URL;

    expect(() => getPerformanceDatabaseUrl()).toThrow(
      "PERF_DATABASE_URL must be explicitly configured.",
    );
  });

  it("requires DATABASE_URL to match the performance database URL", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/stockflow";

    expect(() => getPerformanceDatabaseUrl()).toThrow(
      "DATABASE_URL must exist and be exactly equal to PERF_DATABASE_URL.",
    );
  });

  it("rejects a database other than stockflow_perf", () => {
    const unsafeUrl = "postgresql://localhost:5432/stockflow";
    process.env.PERF_DATABASE_URL = unsafeUrl;
    process.env.DATABASE_URL = unsafeUrl;

    expect(() => getPerformanceDatabaseUrl()).toThrow(
      "PERF_DATABASE_URL must use the stockflow_perf database.",
    );
  });

  it("rejects remote PostgreSQL hosts", () => {
    const remoteUrl = "postgresql://perf:local-only@db.example.com:5432/stockflow_perf";
    process.env.PERF_DATABASE_URL = remoteUrl;
    process.env.DATABASE_URL = remoteUrl;

    expect(() => getPerformanceDatabaseUrl()).toThrow(
      "PERF_DATABASE_URL must point to a local PostgreSQL host.",
    );
  });

  it("rejects non-PostgreSQL protocols", () => {
    const invalidProtocol = "https://localhost/stockflow_perf";
    process.env.PERF_DATABASE_URL = invalidProtocol;
    process.env.DATABASE_URL = invalidProtocol;

    expect(() => getPerformanceDatabaseUrl()).toThrow(
      "PERF_DATABASE_URL must use the PostgreSQL protocol.",
    );
  });

  it("rejects a connection to a different actual database", () => {
    expect(() => assertPerformanceDatabase("stockflow")).toThrow(
      "The connected database is not stockflow_perf.",
    );
  });

  it("reads a command-line argument without assuming its presence", () => {
    process.argv.push("--run-id", "test-run-123");

    expect(getCliArgument("--run-id")).toBe("test-run-123");
    expect(getCliArgument("--missing")).toBeUndefined();
  });
});
