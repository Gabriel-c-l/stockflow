import http from "k6/http";
import { check } from "k6";
import { options, getBaseUrl } from "../config/performance.config.js";
import { loadRunData, warmup } from "./performance-lib.js";

export { options };

export function setup() {
  const data = loadRunData();
  warmup(getBaseUrl());
  return data;
}

export default function () {
  const response = http.get(`${getBaseUrl()}/products`);

  check(response, {
    "GET /products returns 200": (result) => result.status === 200,
  });
}
