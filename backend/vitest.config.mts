import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    maxWorkers: 4,
    testTimeout: 15000,
    include: ["src/**/*.test.ts", "performance/**/*.test.ts"],
    exclude: ["src/**/*.system.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/generated/prisma/**",
        "src/test-utils.ts",
        "src/scripts/**",
        "src/types/express.d.ts",
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
    },
  },
});
