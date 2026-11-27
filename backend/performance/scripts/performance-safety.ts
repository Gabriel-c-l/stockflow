const LOCAL_POSTGRES_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const getCliArgument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

export const getPerformanceDatabaseUrl = (): string => {
  const connectionString = process.env.PERF_DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("PERF_DATABASE_URL must be explicitly configured.");
  }

  if (process.env.DATABASE_URL?.trim() !== connectionString) {
    throw new Error(
      "DATABASE_URL must exist and be exactly equal to PERF_DATABASE_URL.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new Error("PERF_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error("PERF_DATABASE_URL must use the PostgreSQL protocol.");
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ""));
  if (databaseName !== "stockflow_perf") {
    throw new Error("PERF_DATABASE_URL must use the stockflow_perf database.");
  }

  if (!LOCAL_POSTGRES_HOSTS.has(parsedUrl.hostname)) {
    throw new Error("PERF_DATABASE_URL must point to a local PostgreSQL host.");
  }

  return connectionString;
};

export const assertPerformanceDatabase = (databaseName: string | undefined): void => {
  if (databaseName !== "stockflow_perf") {
    throw new Error("The connected database is not stockflow_perf.");
  }
};
