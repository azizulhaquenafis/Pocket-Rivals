import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/fixtures/golf-ai-audit.test.ts"] },
});
