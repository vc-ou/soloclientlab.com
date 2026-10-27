# SoloClientLab.com

Independent site for [SoloClientLab](https://www.soloclientlab.com): SEO guides, product pages for
LeadRadar / NeedRadar, PayPal & Stripe checkout, browser-extension licensing, and a self-hosted admin CMS.

Next.js 16 (App Router) · React 19 · TypeScript · Postgres (direct SQL) · Supabase Auth · Umami

> 架构、数据模型、路由与已知债记录在**内部文档** `docs/` 里。
> 本仓库是公开仓库，`docs/` 已被 `.gitignore` 排除——它只存在于本机，不随代码发布。

### Project docs（内部，不随本仓库发布）

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| `docs/ARCHITECTURE.md` | **现状（as-is）**：今天的路由、数据层、支付授权链路、已知债 | 了解系统 |
| `docs/TARGET-ARCHITECTURE.md` | **目标（to-be）**：分层、四条请求流、失败模式、非功能预算、迁移不变式 | 动手前定方向 |
| `docs/BOUNDARIES.md` | **边界契约**：域划分、5 条硬规则、例外登记、变更协议 | 每次改代码前 |
| `docs/ADMIN-IA-MAP.md` | 后台施工图：21 页 → 7 入口的逐页映射与字段规格 | 改后台前 |
| `docs/adr/` | 决策记录（模板 `0000-template.md`） | 想知道"为什么这么定" |

> 这些文档含收入与漏斗现状、运营自评、已知债——只对内。
> 若要版本化，放到独立的**私有**仓库，不要放回这里。

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:init                 # idempotent schema / migration
npm run dev                     # http://localhost:3000
```

`npm run dev` and `npm run build` both use webpack (`--webpack`), not Turbopack.

### Minimum environment

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | All business data. Without it the app silently falls back to `.data/db.json` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Admin login |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, checkout redirects |
| `PAYPAL_*` | PayPal checkout (the primary payment path) |
| `STRIPE_*` | Subscription / paid-pilot checkout (optional) |
| `LICENSE_SIGNING_SECRET` | License key HMAC (falls back to `PAYPAL_CLIENT_SECRET`) |

Everything else (Umami, Plausible, Edge Add-ons links, IndexNow, GSC/Bing collection) is optional and
documented inline in `.env.example`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (webpack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Contract tests (vitest, isolated temp data dir — never touches the real DB) |
| `npm run verify` | typecheck + lint + boundary budgets + tests + build (same as CI) |
| `npm run db:init` | Apply schema / incremental migration |
| `npm run db:import` | Import `.data/db.json` into Postgres |
| `npm run storage:init` | Create the Supabase storage buckets |
| `npm run indexnow:submit` / `:changed` / `:all` | Push URLs to IndexNow |
| `node --env-file=.env.local scripts/backfill-post-faq-cta.mjs [--apply]` | Dry-run / apply FAQ + end-of-article CTA content for published posts (backs up first) |
| `npm run postdeploy:indexnow` | Post-deploy IndexNow push |

## Layout

```
app/          routes (public pages, /admin, /api)
components/   UI, forms, admin tables — no direct database access
lib/          actions (writes) → db (reads/writes, caching) → postgres/env/types
scripts/      db init, JSON import, storage init, IndexNow, GSC/Bing collectors
docs/         architecture notes
```

Content (articles, SEO titles, FAQs) and products live in the database and are edited through `/admin`
— not in the repository. Changing them does not require a deploy.

## Gotchas

- **Local `.data/db.json` is a snapshot, not the source of truth.** When `DATABASE_URL` is set the app
  reads Postgres; the JSON file is a dev fallback and drifts quickly. Never use it for reporting.
- **Do not use "同步代码商品" in admin casually** — `syncSeedProducts()` upserts from `lib/seed.ts` and
  overwrites product copy and prices in the database.
- **jsonb columns must be written with `sql.json(value)`.** Passing a stringified array with `::jsonb` stores a
  JSON *string* instead of an array and breaks `post.faq.map()`. Check with `select jsonb_typeof(faq) from posts`.
- **Money paths are idempotent by unique index** (`provider_checkout_session_id`, `source_payment_id`).
  Keep that invariant when adding a payment provider.
- If `next build` fails with `EPERM ... next-swc`, the environment cannot write to the SWC cache.
  Install the platform binary locally instead:
  `npm install --no-save @next/swc-darwin-arm64@16.3.0` (use your platform's package).
