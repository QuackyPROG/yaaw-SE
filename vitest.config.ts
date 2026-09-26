import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/cli/**/*.test.ts"],
    // Windows hosted runners are materially slower for the filesystem/Git-heavy installer suite.\n    // Keep the tighter timeout everywhere else so genuine hangs remain visible.\n    testTimeout: process.platform === "win32" ? 60000 : 15000
  }
});
