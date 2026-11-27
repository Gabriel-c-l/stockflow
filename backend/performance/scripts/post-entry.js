import { options, getBaseUrl } from "../config/performance.config.js";
import { preparePerformanceRun, postStockMovement } from "./performance-lib.js";

export { options };

export function setup() {
  return preparePerformanceRun(getBaseUrl());
}

export default function (data) {
  postStockMovement(getBaseUrl(), data, "ENTRY");
}
