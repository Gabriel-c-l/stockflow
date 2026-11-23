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
  const productId = randomItem(data.movementIds);
  const response = http.post(
    `${getBaseUrl()}/stock-movements`,
    JSON.stringify({
      productId,
      type: "ENTRY",
      quantity: 1,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    "POST ENTRY returns 201": (result) => result.status === 201,
  });
}
