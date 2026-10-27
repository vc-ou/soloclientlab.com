// 边界检查（BOUNDARIES R1–R3）
//
// 这三条规则的唯一目的：让"越界"在保存时和 CI 里失败，而不是靠人记。
// 规则定义与理由见 docs/BOUNDARIES.md 第 4 节。
//
// 只启用 import 边界，不启用风格类规则（格式交给编辑器，避免噪音淹没边界告警）。

import tsParser from "@typescript-eslint/parser";

const R1 =
  "R1：app/ 与 components/ 不得直连 platform 或数据库。请通过 @/lib/domains/<域> 取数（BOUNDARIES R1）。";
const R2 = "R2：域之间不得互相 import。编排放在 app 层，横切事件走 @/lib/domains/analytics（BOUNDARIES R2 / 例外 E-001）。";
const R3 = "R3：域的对外入口只有 index.ts。请 import \"@/lib/domains/<域>\"，不要引用域内部文件（BOUNDARIES R3）。";

const DOMAINS = ["content", "catalog", "leads", "commerce", "analytics", "identity"];

/** app/ 与 components/ 禁止触碰的基础设施（连 platform 也不许，只能走域入口） */
const APP_PLATFORM_PATTERNS = [
  { group: ["@/lib/platform", "@/lib/platform/*"], message: R1 },
  { group: ["@/lib/db", "@/lib/postgres"], message: R1 },
  { group: ["postgres"], message: R1 }
];

/** 域可以依赖 platform（依赖方向是 域 → platform），但不得自己建连接池 */
const DOMAIN_PLATFORM_PATTERNS = [
  { group: ["@/lib/postgres", "@/lib/db", "postgres"], message: R1 }
];

/** 域内部文件不得被域外引用（域内自己的文件可以互相引用） */
const DOMAIN_INTERNAL_PATTERNS = [{ group: ["@/lib/domains/*/*"], message: R3 }];
function ownInternalAllowed(domain) {
  return [{ group: ["@/lib/domains/*/*", `!@/lib/domains/${domain}/*`], message: R3 }];
}

/** 某个域不得 import 其他域（analytics 除外，登记为例外 E-001） */
function crossDomainPatterns(ownDomain) {
  // E-003：analytics 是只读聚合层，位于依赖图顶端，可以依赖其他域（反向禁止）
  if (ownDomain === "analytics") return [];
  // E-001：其他域只允许用 analytics 的事件入口
  const forbidden = DOMAINS.filter((d) => d !== ownDomain && d !== "analytics").map((d) => `@/lib/domains/${d}`);
  return [{ group: forbidden, message: R2 }];
}

/** no-restricted-imports 只接受一个选项对象，所有 patterns 必须合并 */
function restrictedRule(patterns) {
  return ["error", { patterns }];
}

export default [
  {
    ignores: ["node_modules/**", ".next/**", "docs/**", "scripts/**", "*.config.*", "next-env.d.ts"]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      "no-restricted-imports": restrictedRule(DOMAIN_INTERNAL_PATTERNS)
    }
  },
  // R1：路由与组件只能走域入口
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedRule([...APP_PLATFORM_PATTERNS, ...DOMAIN_INTERNAL_PATTERNS])
    }
  },
  // R2：域之间互不 import
  ...DOMAINS.map((domain) => ({
    files: [`lib/domains/${domain}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": restrictedRule([
        ...DOMAIN_PLATFORM_PATTERNS,
        ...ownInternalAllowed(domain),
        ...crossDomainPatterns(domain)
      ])
    }
  })),
];
