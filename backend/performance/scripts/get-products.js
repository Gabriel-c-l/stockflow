import http from "k6/http";
import { check } from "k6";
import { options, getBaseUrl } from "../config/performance.config.js";
import { preparePerformanceRun } from "./performance-lib.js";

export { options };

export function setup() {
  return preparePerformanceRun(getBaseUrl());
}

export default function () {
  const response = http.get(`${getBaseUrl()}/products`);

  check(response, {
    "GET /products returns 200": (result) => result.status === 200,
  });
}
