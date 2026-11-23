export const VU_LEVELS = [1, 5, 10, 25, 50];
export const WARMUP_DURATION_SECONDS = 30;
export const MEASUREMENT_DURATION_SECONDS = 60;

export function getBaseUrl() {
  const baseUrl = (__ENV.PERF_BASE_URL || "http://127.0.0.1:3333").trim();

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("PERF_BASE_URL must be a valid local HTTP or HTTPS URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("PERF_BASE_URL must use HTTP or HTTPS.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("PERF_BASE_URL must not contain credentials.");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error(
      "PERF_BASE_URL is restricted to localhost, 127.0.0.1 or ::1.",
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

export const options = {
  discardResponseBodies: false,
  summaryTrendStats: ["avg", "med", "p(50)", "p(95)", "p(99)", "max"],
  scenarios: {
    levels: {
      executor: "ramping-vus",
      startVUs: 0,
      gracefulRampDown: "10s",
      gracefulStop: "10s",
      stages: [
        { duration: "10s", target: 1 },
        { duration: "60s", target: 1 },
        { duration: "10s", target: 5 },
        { duration: "60s", target: 5 },
        { duration: "10s", target: 10 },
        { duration: "60s", target: 10 },
        { duration: "10s", target: 25 },
        { duration: "60s", target: 25 },
        { duration: "10s", target: 50 },
        { duration: "60s", target: 50 },
        { duration: "10s", target: 0 },
      ],
    },
  },
};
