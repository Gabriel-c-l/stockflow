import http from "k6/http";
import { check } from "k6";
import { options, getBaseUrl } from "../config/performance.config.js";
import { preparePerformanceRun } from "./performance-lib.js";

export { options };

export function setup() {
  const executionId = (__ENV.PERF_EXECUTION_ID || "").trim();
  if (!executionId) {
    throw new Error("PERF_EXECUTION_ID is required for POST /products.");
  }
  if (!/^[A-Za-z0-9_-]+$/.test(executionId)) {
    throw new Error(
      "PERF_EXECUTION_ID must contain only letters, numbers, underscores or hyphen.",
    );
  }

  return { ...preparePerformanceRun(getBaseUrl()), executionId };
}

export default function (data) {
  const sku = `${data.prefix}CREATE-${data.executionId}-${__VU}-${__ITER}`;
  const response = http.post(
    `${getBaseUrl()}/products`,
    JSON.stringify({
      sku,
      name: `Performance product ${__VU}-${__ITER}`,
      minStock: 0,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    "POST /products returns 201": (result) => result.status === 201,
  });
}
