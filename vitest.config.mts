import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    // Agent test runs and their fixtures hold other projects' code and tests, not Ordalin's.
    exclude: [...configDefaults.exclude, ".ordalin-tests/**", ".ordalin-imports/**", "scripts/agent-test/fixtures/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
});
