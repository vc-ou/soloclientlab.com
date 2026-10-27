#!/usr/bin/env node
/**
 * 公开仓库闸门：确保只有"可以公开"的内容进入 git。
 *
 * 背景：Vercel 免费计划无法自动部署私有仓库（需专业版才能加团队成员），
 * 所以代码仓保持 public。内部文档与运营资料放在独立的私有仓
 * （soloclientlab-internal），不进入本仓库。
 *
 * 用法：
 *   node scripts/check-public-repo.mjs              # 检查全部已跟踪文件
 *   node scripts/check-public-repo.mjs --staged     # 只检查已暂存内容
 *   node scripts/check-public-repo.mjs --range A..B # 只检查一段提交涉及的文件（pre-push 用）
 */

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** 绝不能进入公开仓库的路径（相对仓库根） */
const FORBIDDEN_PATHS = [
  { test: (p) => p === "docs" || p.startsWith("docs/"), why: "内部架构/边界/RUNBOOK 文档（在私有仓 soloclientlab-internal）" },
  { test: (p) => p === ".workbuddy" || p.startsWith(".workbuddy/"), why: "工作记录" },
  { test: (p) => p === ".data" || p.startsWith(".data/"), why: "本地数据快照与备份（含真实业务数据）" },
  { test: (p) => p === ".tools" || p.startsWith(".tools/"), why: "本地工具与登录凭据" },
  { test: (p) => p === ".env.local" || p.endsWith("/.env.local"), why: "真实环境变量" },
  { test: (p) => /^SEO-.*\.md$/.test(p) || p.startsWith("SEO-"), why: "内容/SEO 策略稿" },
  { test: (p) => /gsc-api-.*\.json$/i.test(p), why: "GSC 服务账号私钥" },
  { test: (p) => /\.(pem|p12|key)$/i.test(p), why: "私钥文件" },
  { test: (p) => /^english-draft-/.test(p), why: "草稿文稿" }
];

/** 内容里出现就不能公开的模式 */
const FORBIDDEN_CONTENT = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: "私钥内容" },
  { re: /\b(gh[pousr]_[A-Za-z0-9]{20,})\b/, why: "GitHub token" },
  { re: /\b(sk|rk)_live_[A-Za-z0-9]{10,}\b/, why: "Stripe live key" },
  { re: /\bAKIA[0-9A-Z]{16}\b/, why: "AWS access key" },
  { re: /"private_key"\s*:\s*"-----BEGIN/, why: "服务账号私钥 JSON" },
  { re: /\bpostgres(ql)?:\/\/[^\s"']*:[^\s"'@]+@/, why: "带密码的数据库连接串" }
];

const git = (argv) => execFileSync("git", argv, { encoding: "utf8" }).trim();

function filesToCheck() {
  if (hasFlag("--range")) {
    const range = flagValue("--range");
    if (!range) throw new Error("--range 需要一个 A..B 参数");
    return git(["diff", "--name-only", range]).split("\n").filter(Boolean);
  }
  if (hasFlag("--staged")) {
    return git(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
  }
  return git(["ls-files"]).split("\n").filter(Boolean);
}

const files = filesToCheck();
const problems = [];

for (const file of files) {
  for (const rule of FORBIDDEN_PATHS) {
    if (rule.test(file)) {
      problems.push({ file, why: rule.why, kind: "path" });
    }
  }
}

// 内容扫描：只扫文本类文件，跳过二进制与超大文件
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|txt|yml|yaml|css|py|sh|example|gitignore)$|^\.gitignore$|^\.env\.example$/;
for (const file of files) {
  if (!TEXT.test(file)) continue;
  let content = "";
  try {
    content = await readFile(path.join(process.cwd(), file), "utf8");
  } catch {
    continue; // 文件可能已被删除（检查旧提交时）
  }
  if (content.length > 2_000_000) continue;
  for (const rule of FORBIDDEN_CONTENT) {
    if (rule.re.test(content)) {
      problems.push({ file, why: rule.why, kind: "content" });
    }
  }
}

if (problems.length) {
  console.error("❌ 有内容不允许进入公开仓库：\n");
  const seen = new Set();
  for (const p of problems) {
    const key = `${p.file}:${p.why}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.error(`  [${p.kind}] ${p.file}\n         ${p.why}`);
  }
  console.error(
    "\n处置：把该文件移到私有仓 soloclientlab-internal，或在 .gitignore 中排除；" +
      "\n若是误报，调整 scripts/check-public-repo.mjs 的规则后重试。"
  );
  process.exit(1);
}

console.log(`✅ 公开仓库检查通过（${files.length} 个文件，无敏感路径/内容）`);
