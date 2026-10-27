import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 每个测试文件独立进程，避免模块级缓存（连接池、本地库单例）互相污染
    pool: "forks",
    sequence: { concurrent: false }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts")
    }
  }
});
