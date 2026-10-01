import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Every test file shares one real Postgres database (no per-file schema/
    // transaction isolation), and several suites mutate shared singleton
    // rows (LoyaltyConfig) for their duration. Running files in parallel
    // made that flaky — a concurrent file could read the wrong config value
    // mid-run. Sequential files trade some wall-clock time for determinism.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
