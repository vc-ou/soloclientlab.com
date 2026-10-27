import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

// 每个测试文件用独立的兜底库目录，且强制走本地 JSON 模式（不连生产库）
export function useIsolatedDataDir() {
  const dir = path.join(tmpdir(), `scl-test-${process.pid}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  process.env.SCL_DATA_DIR = dir;
  delete process.env.DATABASE_URL;
  return {
    dir,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}
