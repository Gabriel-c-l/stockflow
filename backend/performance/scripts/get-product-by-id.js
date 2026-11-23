import http from "k6/http";
import { check } from "k6";
import { options, getBaseUrl } from "../config/performance.config.js";
import { loadRunData, randomItem, warmup } from "./performance-lib.js";

export { options };

export function setup() {
  const data = loadRunData();
  warmup(getBaseUrl());
  return data;
}

export default function (data) {
  const productId = randomItem(data.queryIds);
  const response = http.get(`${getBaseUrl()}/products/${productId}`);

  check(response, {
    "GET /products/:id returns 200": (result) => result.status === 200,
  });
}
