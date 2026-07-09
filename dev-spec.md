# SoloClientLab.com V1 开发规格

## 1. 产品范围

本项目是一个面向英文用户的独立站，首版目标是验证：

`Research 内容 / 外部分发 -> 直接使用工具 -> 反馈 / 邮箱承接 -> Waitlist -> 后续付费验证`

V1 聚焦主题：

`client acquisition for solo service businesses`

V1 不开发支付、会员、社区、自动邮件营销、AI 自动抓取、Programmatic SEO、复杂 Dashboard。

## 2. 技术栈

- Frontend: Next.js
- Backend: Next.js Server Actions
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- Email: MailerLite
- Analytics: Plausible
- AI: OpenAI API, only for admin-side summarizing, tagging, and draft assistance
- Deployment: Vercel

## 3. 信息架构

### Public Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Home | 主入口，优先推动工具开始使用，并并列承接邮箱 |
| `/research` | Research index | 展示研究文章列表，并把流量导向工具或后续承接 |
| `/research/[slug]` | Research detail | 承接 SEO 流量，并导向工具、资源或订阅 |
| `/resources` | Resources hub | 隐藏的次级承接页，用于研究集合与订阅承接 |
| `/resources/client-acquisition-report` | Resource page | 现有次级资源页，偏向更新与订阅承接，不作为主入口 |
| `/newsletter` | Newsletter landing | 解释订阅价值并承接高意向用户 |
| `/waitlist/[slug]` | Waitlist page | 收集高意向用户 |
| `/about` | About | 介绍作者和研究方法 |

### Admin Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/admin` | Admin overview | 查看核心指标 |
| `/admin/demands` | Demand database | 管理需求记录 |
| `/admin/posts` | Research CMS | 管理文章 |
| `/admin/resources` | Resource manager | 管理免费资源 |
| `/admin/subscribers` | Subscriber center | 管理订阅用户 |
| `/admin/waitlists` | Waitlist center | 管理 Waitlist 线索 |

Admin routes require Supabase Auth.

## 4. Public Pages

### 4.1 Home `/`

Primary goal: tool engagement.

Required sections:

- Hero
- Tool entry module
- Value proposition
- Lightweight feedback prompt
- Install extension CTA for tool flows that require browser extension usage
- Featured research
- Tool + email coexistence block
- Research method or simple proof section

Hero copy:

- H1: `A practical tool for solo service businesses that need clients`
- Subtitle: `Use the tool first, see immediate value, then decide whether you want deeper research, updates, or to continue in the full extension workflow.`
- Primary CTA: `Start using the tool`
- Secondary CTA: `Read the research`

Behavior:

- Primary CTA jumps to the homepage tool entry section
- Secondary CTA links to `/research`
- Homepage includes an interactive tool entry area above the fold or immediately below the hero
- Tool can be started without login and without mandatory email capture
- Newsletter form remains available on homepage as a parallel path, not as the blocking first step
- Tool section includes a lightweight feedback question such as `Was this useful?` or `What were you trying to solve?`
- For tools that require browser extension for real-world usage, homepage includes a post-result CTA linking to the Chrome Web Store `Unlisted` listing
- On successful subscription, show a success state without redirecting

Acceptance criteria:

- User can start the tool from homepage without registration
- User can still subscribe from homepage
- Submission creates a row in `subscribers`
- Source fields identify homepage signup
- Homepage clearly presents both tool entry and email capture without forcing order
- If extension continuation is enabled, the page includes a clear install CTA that points to the Chrome Web Store `Unlisted` listing
- Page has SEO title and meta description

### 4.2 Research Index `/research`

Purpose: list published research articles.

Required elements:

- Page title
- Short description
- Topic filter
- Article list
- CTA that routes users toward the tool or newsletter

Article card fields:

- title
- summary
- primary topic
- published date
- CTA label if configured

Behavior:

- Only posts with `status = published` are visible
- Sort by `published_at desc`
- Topic filter uses `topic_tag`
- Primary page CTA can point back to the homepage tool section until a dedicated tool route exists

Acceptance criteria:

- Published posts render correctly
- Draft posts do not render publicly
- User can click into article detail

### 4.3 Research Detail `/research/[slug]`

Purpose: SEO content page and tool / conversion bridge.

Required elements:

- Title
- Summary
- Published date
- Main content
- Related demand evidence section, if available
- Inline CTA block
- End-of-post Newsletter CTA

CTA types:

- `tool`
- `extension_install`
- `newsletter`
- `lead_magnet`
- `waitlist`

Behavior:

- Render content from Markdown
- Use `seo_title` and `seo_description` for metadata
- If `cta_type = tool`, CTA links to `/#tool-entry` or the current homepage tool anchor
- If `cta_type = extension_install`, CTA links to configured Chrome Web Store `Unlisted` URL
- If `cta_type = lead_magnet`, CTA links to `/resources/client-acquisition-report`
- If `cta_type = newsletter`, CTA shows inline email form
- If `cta_type = waitlist`, CTA links to configured waitlist page

Acceptance criteria:

- Article renders Markdown content
- Email signup from article creates subscriber with `source_type = post`
- Research detail can route readers directly into the tool experience
- Metadata is generated per post

### 4.4 Resources Hub `/resources`

Purpose: hidden secondary hub for research-adjacent subscription paths.

Required sections:

- Headline
- Short description
- Link to research archive
- Newsletter capture
- Optional featured resource card if resource metadata exists

Behavior:

- Page is not linked from primary header navigation
- Page can surface resource-style content, but should not be treated as the homepage primary conversion path
- Newsletter capture remains the main conversion action on this page

Acceptance criteria:

- Page renders without being part of primary navigation
- Newsletter capture works from this page

### 4.5 Resource Detail `/resources/client-acquisition-report`

Purpose: support an existing secondary resource/update page without treating it as the site's main offer.

Required sections:

- Resource headline
- Short value description
- Email form
- Research/update framing

Behavior:

- On submit, create row in `subscribers`
- Link subscriber to resource through `lead_magnet` if configured
- Show success message
- If MailerLite API is configured, sync subscriber
- If MailerLite is not configured, local save must still work
- Copy should reflect “join for updates and future resources” rather than “download the main report”

Acceptance criteria:

- Email signup works without MailerLite
- Duplicate email does not create duplicate active subscriber rows
- Conversion source is stored as `resource`

### 4.6 Newsletter Page `/newsletter`

Purpose: standalone subscription landing page.

Required sections:

- Headline
- What subscribers receive
- Email form
- Recent or featured research links

Suggested headline:

`AI Pain Radar Weekly`

Behavior:

- Email form creates subscriber with `source_type = newsletter_page`
- User sees success state after submit
- Copy should frame the newsletter as follow-up insight after using the tool or reading research

Acceptance criteria:

- Page can collect email
- Subscriber source is stored correctly

### 4.7 Waitlist Page `/waitlist/[slug]`

Purpose: collect high-intent users for a specific validation topic.

Initial waitlist slug:

`client-acquisition-ai-workflow`

Suggested offer:

`AI Client Acquisition Workflow for Solo Service Businesses`

Form fields:

- email, required
- interest_tag, optional select
- note, optional textarea

Interest options:

- `finding_leads`
- `creating_content`
- `validating_offer`
- `following_up`
- `other`

Behavior:

- Submit creates row in `waitlists`
- If email is not yet in `subscribers`, create or upsert subscriber with `source_type = waitlist`
- Show success state

Acceptance criteria:

- Waitlist form stores email and interest
- Existing subscriber can join waitlist without error

### 4.8 Extension Install Flow

Purpose: move qualified users from web trial into the full browser-extension workflow.

Distribution method:

- Chrome Web Store `Unlisted`

Requirements:

- Install CTA is shown only after the user has had a chance to see trial results, or in clearly secondary placement
- CTA opens the Chrome Web Store listing
- Page copy must not imply GitHub download or manual unpacked installation
- If the Chrome Web Store link is not yet available, CTA should degrade to newsletter or waitlist capture

Acceptance criteria:

- Install CTA can be configured from environment or content config
- Clicks on install CTA are trackable
- User-facing copy matches the `Unlisted` distribution path

### 4.9 About `/about`

Purpose: credibility and research method.

Required sections:

- Who runs SoloClientLab.com
- What the site studies
- Research method
- Newsletter CTA

Acceptance criteria:

- Page links to `/newsletter`
- Page does not include complex portfolio or product catalog in V1

## 5. Admin Pages

### 5.1 Admin Overview `/admin`

Display metric cards:

- total demands
- published posts
- total subscribers
- qualified subscribers
- waitlist count

Display simple recent activity:

- latest subscribers
- latest waitlist entries
- latest demands

Acceptance criteria:

- Authenticated user can view metrics
- Unauthenticated user is redirected to login

### 5.2 Demand Database `/admin/demands`

List columns:

- title
- source_platform
- persona
- keyword
- pain_score
- frequency_score
- payment_score
- evidence_strength
- status
- created_at

Filters:

- source_platform
- persona
- status
- topic tag

Create/edit fields:

- title, required
- source_url
- source_platform
- user_quote
- persona
- job_to_be_done
- problem_stage
- solution_attempted
- keyword
- pain_score, integer 1-5
- frequency_score, integer 1-5
- payment_score, integer 1-5
- evidence_strength, enum
- status, enum
- tags, text array
- next_action

Enums:

- evidence_strength: `weak`, `medium`, `strong`
- status: `raw`, `reviewed`, `clustered`, `used_in_post`, `archived`

Acceptance criteria:

- Admin can create, edit, archive demands
- Scores are constrained to 1-5
- Demand records can be linked to posts

### 5.3 Research CMS `/admin/posts`

List columns:

- title
- slug
- status
- topic_tag
- cta_type
- published_at

Create/edit fields:

- title, required
- slug, required unique
- summary
- content, Markdown
- related_persona
- related_demand_ids
- topic_tag
- seo_title
- seo_description
- cta_type
- cta_target
- status
- published_at

Enums:

- cta_type: `tool`, `extension_install`, `newsletter`, `lead_magnet`, `waitlist`, `none`
- status: `draft`, `published`, `archived`

Acceptance criteria:

- Admin can create draft post
- Published post appears on public research index
- Draft post does not appear publicly
- Slug must be unique

### 5.4 Resources `/admin/resources`

Note:

- This module can remain in admin because resource-related metadata and legacy pages still exist
- It is no longer treated as the primary public acquisition path

List columns:

- title
- slug
- type
- related_topic
- subscriber_count
- conversion_rate

Create/edit fields:

- title
- slug
- type
- audience
- related_topic
- landing_page_slug
- delivery_url
- status

Enums:

- type: `report`, `checklist`, `template`, `prompt_pack`
- status: `draft`, `published`, `archived`

Acceptance criteria:

- Admin can configure the first resource
- Public resource page can read resource metadata

### 5.5 Subscribers `/admin/subscribers`

List columns:

- email
- source_type
- source_page
- lead_magnet
- persona_tag
- topic_tag
- note
- status
- created_at

Filters:

- source_type
- lead_magnet
- persona_tag
- topic_tag
- status

Enums:

- status: `active`, `unsubscribed`, `bounced`

Acceptance criteria:

- Admin can view and filter subscribers
- Duplicate email is handled by upsert
- Admin can export CSV

### 5.6 Waitlists `/admin/waitlists`

List columns:

- project_name
- page_slug
- email
- interest_tag
- source_page
- created_at

Acceptance criteria:

- Admin can view waitlist signups
- Admin can filter by `page_slug` and `interest_tag`
- Admin can export CSV

## 6. Database Schema

### demands

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| title | text | yes | |
| source_url | text | no | |
| source_platform | text | no | e.g. Reddit, X, Indie Hackers |
| user_quote | text | no | original user wording |
| persona | text | no | |
| job_to_be_done | text | no | |
| problem_stage | text | no | |
| solution_attempted | text | no | |
| keyword | text | no | |
| pain_score | int | no | 1-5 |
| frequency_score | int | no | 1-5 |
| payment_score | int | no | 1-5 |
| evidence_strength | text | no | weak, medium, strong |
| status | text | yes | raw, reviewed, clustered, used_in_post, archived |
| tags | text[] | no | |
| next_action | text | no | |
| created_at | timestamptz | yes | default now() |
| updated_at | timestamptz | yes | default now() |

### posts

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| title | text | yes | |
| slug | text | yes | unique |
| summary | text | no | |
| content | text | no | Markdown |
| related_persona | text | no | |
| related_demand_ids | uuid[] | no | demand ids |
| topic_tag | text | no | |
| seo_title | text | no | |
| seo_description | text | no | |
| cta_type | text | yes | tool, extension_install, newsletter, lead_magnet, waitlist, none |
| cta_target | text | no | URL or slug |
| status | text | yes | draft, published, archived |
| published_at | timestamptz | no | |
| created_at | timestamptz | yes | default now() |
| updated_at | timestamptz | yes | default now() |

### resources

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| title | text | yes | |
| slug | text | yes | unique |
| type | text | yes | report, checklist, template, prompt_pack |
| audience | text | no | |
| related_topic | text | no | |
| landing_page_slug | text | no | |
| delivery_url | text | no | |
| status | text | yes | draft, published, archived |
| created_at | timestamptz | yes | default now() |
| updated_at | timestamptz | yes | default now() |

### subscribers

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| email | text | yes | unique lowercase |
| source_page | text | no | |
| source_type | text | no | home, post, resource, newsletter_page, waitlist |
| lead_magnet | text | no | |
| persona_tag | text | no | |
| topic_tag | text | no | |
| note | text | no | lightweight feedback or user context |
| status | text | yes | active, unsubscribed, bounced |
| mailerlite_id | text | no | |
| created_at | timestamptz | yes | default now() |
| updated_at | timestamptz | yes | default now() |

### waitlists

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| project_name | text | yes | |
| page_slug | text | yes | |
| email | text | yes | lowercase |
| source_page | text | no | |
| interest_tag | text | no | |
| note | text | no | |
| created_at | timestamptz | yes | default now() |

### metrics

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | primary key |
| metric_name | text | yes | |
| metric_value | numeric | yes | |
| dimension | text | no | |
| recorded_at | timestamptz | yes | default now() |

## 7. Server Actions

### subscribeUser(input)

Input:

- email
- source_page
- source_type
- lead_magnet
- persona_tag
- topic_tag
- note

Behavior:

- Validate email
- Normalize email to lowercase
- Upsert into `subscribers`
- Preserve `created_at` for existing subscriber
- Update source fields only if new values are provided
- Save optional lightweight feedback note if provided
- Try MailerLite sync if API key exists
- Return success even if MailerLite sync fails after local save

### joinWaitlist(input)

Input:

- project_name
- page_slug
- email
- source_page
- interest_tag
- note

Behavior:

- Validate email
- Insert into `waitlists`
- Upsert same email into `subscribers` with `source_type = waitlist`
- Return success state

### createDemand(input)

Admin only.

Behavior:

- Validate required fields
- Validate scores are 1-5 if provided
- Insert row into `demands`

### updatePost(input)

Admin only.

Behavior:

- Validate unique slug
- Save Markdown content
- If status changes to `published` and `published_at` is empty, set `published_at = now()`

## 8. Analytics Events

Track these events through Plausible or local metrics:

| Event | Trigger |
| --- | --- |
| `tool_started` | user begins the homepage tool flow |
| `tool_completed` | user reaches the core result or completion state |
| `tool_feedback_submitted` | user submits lightweight post-result feedback |
| `extension_install_clicked` | user clicks the Chrome Web Store install CTA |
| `newsletter_signup` | successful subscriber creation |
| `resource_signup` | successful resource form submission |
| `waitlist_signup` | successful waitlist form submission |
| `research_cta_click` | user clicks CTA inside research article |
| `lead_magnet_cta_click` | user clicks lead magnet CTA |

## 9. Initial Seed Data

### Resource

- title: `Client Acquisition Updates for Solo Professionals`
- slug: `client-acquisition-report`
- type: `report`
- audience: `solo_service_businesses`
- related_topic: `client_acquisition`
- landing_page_slug: `client-acquisition-report`
- status: `published`

Note:

- This seed data exists to support the current secondary page structure
- It is not the primary homepage conversion offer

### Waitlist

- page_slug: `client-acquisition-ai-workflow`
- project_name: `AI Client Acquisition Workflow`

### Extension distribution

- distribution: `chrome_web_store_unlisted`
- listing_url: `TBD`

### Posts

Create at least 3 draft posts:

- `How solo service businesses get clients without relying on referrals`
- `25 client acquisition pain points from solo professionals`
- `Why most marketing advice fails for one-person service businesses`

## 10. MVP Acceptance Checklist

- Public homepage renders and lets users start the tool without registration
- Public homepage still has working email signup
- Public homepage can optionally route qualified users to Chrome Web Store `Unlisted`
- Research index renders published posts only
- Research detail renders Markdown and CTA
- Secondary resource page collects email and stores source metadata
- Newsletter page collects email
- Waitlist page collects high-intent users
- About page renders
- Admin login protects admin routes
- Admin can create, edit, and archive demands
- Admin can create draft and published posts
- Admin can view subscribers and waitlists
- Subscriber duplicate email handling works
- Metrics overview shows basic counts
- App works without MailerLite configured
- App has metadata for public pages
- Tool-first path and email path can coexist on homepage without blocking each other
- No payment system is implemented in V1

## 11. Out Of Scope

- Stripe payment integration
- Membership
- Community
- Programmatic SEO
- AI automatic scraping
- Automated email campaigns
- Multi-language site
- Complex project management system
- Full Demand OS dashboard
