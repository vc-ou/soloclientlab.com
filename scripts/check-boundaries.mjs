#!/usr/bin/env node
/**
 * 边界预算检查（BOUNDARIES R4 / R5）
 *
 * 为什么需要它：文件膨胀和路由悄悄变多是"边界开始失守"的早期信号。
 * 做法是**棘轮（ratchet）**：以当前状态为基线，只拦新增违规；
 * 修好一条就从基线里删一条，基线只减不增。
 *
 * 用法：
 *   node scripts/check-boundaries.mjs                  # CI 模式：只报新增违规
 *   node scripts/check-boundaries.mjs --update-baseline # 生成/更新基线（仅在确实修好之后用）
 *   node scripts/check-boundaries.mjs --report          # 看全量现状
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, "scripts", "boundary-baseline.json");
const UPDATE = process.argv.includes("--update-baseline");
const REPORT = process.argv.includes("--report");

const BUDGET = {
  file: 400,        // R4：单文件行数
  page: 250,        // R4：app/**/page.tsx
  css: 1500,        // R4：全局样式
  adminPages: 12,   // R5：后台 page.tsx 数量
  publicPages: 20   // R5：公开 page.tsx 数量
};

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "docs", "public", ".data", ".vercel"]);

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = await walk(ROOT);
const violations = []; // { id, kind, detail, value, budget }

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const source = await readFile(file, "utf8");
  const lines = source.split("\n").length;

  if (rel.endsWith(".css") && lines > BUDGET.css) {
    violations.push({ id: `css:${rel}`, kind: "css", detail: rel, value: lines, budget: BUDGET.css });
  } else if (!rel.endsWith(".css")) {
    const isPage = /^app\/.*page\.tsx$/.test(rel);
    const limit = isPage ? Math.min(BUDGET.page, BUDGET.file) : BUDGET.file;
    if (lines > limit) {
      violations.push({ id: `file:${rel}`, kind: isPage ? "page" : "file", detail: rel, value: lines, budget: limit });
    }
  }

  // 兜底：任何地方再出现直连 lib/db 也拦（R1 的静态补充，防 lint 被绕过）
  if (/\.(ts|tsx)$/.test(rel) && /from ["']@\/lib\/db["']/.test(source)) {
    if (!/^lib\/domains\/[^/]+\/index\.ts$/.test(rel)) {
      violations.push({ id: `import:${rel}`, kind: "import", detail: rel, value: 1, budget: 0 });
    }
  }
}

// R5：路由数量
const adminPages = files.filter((f) => /^app\/admin\/.*page\.tsx$/.test(path.relative(ROOT, f)));
const publicPages = files.filter((f) => {
  const rel = path.relative(ROOT, f);
  return /^app\/.*page\.tsx$/.test(rel) && !rel.startsWith("app/admin/");
});

if (adminPages.length > BUDGET.adminPages) {
  violations.push({
    id: "routes:admin",
    kind: "routes",
    detail: "app/admin/**/page.tsx",
    value: adminPages.length,
    budget: BUDGET.adminPages
  });
}
if (publicPages.length > BUDGET.publicPages) {
  violations.push({
    id: "routes:public",
    kind: "routes",
    detail: "app/**/page.tsx（不含 admin）",
    value: publicPages.length,
    budget: BUDGET.publicPages
  });
}

let baseline = { generated_at: null, reason: "", known: [] };
try {
  baseline = JSON.parse(await readFile(BASELINE_PATH, "utf8"));
} catch {
  // 没有基线 = 空基线
}

const knownIds = new Set(baseline.known.map((item) => item.id));
const newViolations = violations.filter((v) => !knownIds.has(v.id));
const fixed = baseline.known.filter((item) => !violations.some((v) => v.id === item.id));

if (UPDATE) {
  // 只保留仍然存在的违规；新增的也记进去（更新基线必须显式为之）
  const next = {
    generated_at: new Date().toISOString(),
    reason: "棘轮基线：只减不增。修好一条就从这里删一条。",
    known: violations
      .map(({ id, kind, detail, value, budget }) => ({ id, kind, detail, value, budget }))
      .sort((a, b) => a.id.localeCompare(b.id))
  };
  await writeFile(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  console.log(`基线已更新：${next.known.length} 条`);
  process.exit(0);
}

if (REPORT) {
  console.log("当前全部违规：");
  for (const v of violations.sort((a, b) => b.value - a.value)) {
    console.log(`  ${String(v.value).padStart(5)} / ${String(v.budget).padEnd(5)} ${v.kind.padEnd(6)} ${v.detail}`);
  }
  console.log(`\n共 ${violations.length} 条（基线内 ${violations.length - newViolations.length} 条，新增 ${newViolations.length} 条）`);
  process.exit(0);
}

if (fixed.length) {
  console.log(`✅ 已修复 ${fixed.length} 条基线违规，请运行 --update-baseline 收紧基线：`);
  for (const item of fixed) console.log(`   ${item.id}`);
  console.log("");
}

if (newViolations.length) {
  console.error("❌ 新增边界违规（基线里没有）：\n");
  for (const v of newViolations) {
    console.error(`  ${v.kind}: ${v.detail} → ${v.value}，预算 ${v.budget}`);
  }
  console.error("\n处置：拆文件 / 合并路由；若确属必要，先改 docs/BOUNDARIES.md 的预算并写 ADR。");
  process.exit(1);
}

console.log(`✅ 边界预算通过（基线内 ${violations.length} 条待修，新增 0 条）`);
if (violations.length) {
  const top = violations.sort((a, b) => b.value - a.value).slice(0, 5);
  console.log("   最大的几条待修：");
  for (const v of top) console.log(`   ${String(v.value).padStart(5)} 行  ${v.detail}`);
}
