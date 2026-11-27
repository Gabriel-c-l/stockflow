import http from "k6/http";
import { check, sleep } from "k6";

export function loadRunData() {
  const raw = open("../results/performance-run.json");
  const data = JSON.parse(raw);
  const expectedRunId = __ENV.PERF_RUN_ID;

  if (!expectedRunId) {
    throw new Error("PERF_RUN_ID must identify the prepared performance run.");
  }

  if (data.runId !== expectedRunId) {
    throw new Error("PERF_RUN_ID does not match the performance registry.");
  }

  if (!data.prefix.startsWith(`PERF-${expectedRunId}-`)) {
    throw new Error("Performance registry prefix validation failed.");
  }

  return data;
}

export function warmup(baseUrl) {
  for (let second = 0; second < 30; second += 1) {
    http.get(`${baseUrl}/health`);
    sleep(1);
  }
}

export function randomItem(items) {
  if (!items || items.length === 0) {
    throw new Error("The performance registry has no prepared IDs.");
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function preparePerformanceRun(baseUrl) {
  const data = loadRunData();
  warmup(baseUrl);
  return data;
}

export function postStockMovement(baseUrl, data, type) {
  const productId = randomItem(data.movementIds);
  const response = http.post(
    `${baseUrl}/stock-movements`,
    JSON.stringify({ productId, type, quantity: 1 }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    [`POST ${type} returns 201`]: (result) => result.status === 201,
  });
}
