# SoloClientLab.com V2 开发规格

## 1. 产品范围

本项目是一个面向英文用户的独立站，V2 目标是验证：

`Research -> SEO / GSC -> Markdown 内链 -> Products -> Trial / Install / Configure / Review / Feedback / Paid pilot`

V2 聚焦主题：

`public demand signals + LeadRadar for CNC / Manufacturing`

V2 不开发完整支付、会员、社区、自动邮件营销、AI 自动抓取、Programmatic SEO、复杂 Dashboard。

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
| `/` | Home | Research + Products 共存入口，主 CTA 导向 Products / LeadRadar，次级 CTA 导向 Research |
| `/research` | Research index | 展示研究文章列表，按三个 V2 栏目组织 SEO / GSC 承接 |
| `/research/[slug]` | Research detail | 承接 SEO 流量，通过 Markdown 内链导向 Products、产品页、栏目或相关文章 |
| `/products` | Products index | 展示当前正式产品入口 |
| `/products/leadradar` | LeadRadar product page | LeadRadar for CNC / Manufacturing 正式产品页 |
| `/tools/leadradar` | LeadRadar demo bridge | 保留旧曝光页，作为 demo / bridge 页面并链接到正式产品页 |
| `/resources` | Resources hub | Legacy redirect / secondary route, not primary IA |
| `/resources/client-acquisition-report` | Resource page | Legacy secondary resource route |
| `/newsletter` | Newsletter landing | Legacy redirect route, not primary IA |
| `/waitlist/[slug]` | Product access page | Product Access / Trial Access / Co-build Access 采集页 |
| `/about` | About | Research + Product Lab 方法说明 |

### Admin Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/admin` | Admin overview | 查看核心指标 |
| `/admin/metrics` | Metrics center | 查看产品侧本地信号，并提示结合 GSC |
| `/admin/post-analytics` | Post analytics | 查看文章站内访问，GSC 是文章判断主来源 |
| `/admin/posts` | Article CMS | 管理 SEO-ready 文章 |
| `/admin/subscribers` | Contacts | 查看历史订阅、联系记录和产品访问相关联系人 |
| `/admin/waitlists` | Access Leads | 查看 Product Access / Trial Access / Co-build Access 线索 |
| `/admin/feedback` | Trial & Calibration Feedback | 查看产品试用和校准反馈 |

Admin routes require Supabase Auth.

Legacy admin routes remain available by direct URL for old data compatibility, but they are not part of the V2 main sidebar:

- `/admin/demands`
- `/admin/resources`
- `/admin/subscribers` remains the URL, but the UI calls it Contacts
- `/admin/waitlists` remains the URL, but the UI calls it Access Leads

## 4. Public Pages

### 4.1 Home `/`

Primary goal: Research + Products 共存，并优先导向 Products / LeadRadar。

Required sections:

- Hero
- Products / LeadRadar entry
- Value proposition
- Lightweight feedback prompt
- Install extension CTA for tool flows that require browser extension usage
- Featured research
- Research + Product Lab proof
- Research method or simple proof section

Hero copy:

- H1: `Research that explains the signal. Products that help you act on it.`
- Subtitle: `SoloClientLab studies public conversations, search behavior, and workflow friction, then turns repeatable demand signals into focused products.`
- Primary CTA: `Explore products`
- Secondary CTA: `Explore research`

Behavior:

- Primary CTA links to `/products` or `/products/leadradar`
- Secondary CTA links to `/research`
- Homepage includes an interactive tool entry area above the fold or immediately below the hero
- Tool can be started without login and without mandatory email capture
- Newsletter / lead magnet / waitlist language is not used in the homepage primary path
- Tool section includes a lightweight feedback question such as `Was this useful?` or `What were you trying to solve?`
- For tools that require browser extension for real-world usage, homepage routes users to the product page first; public installation uses Microsoft Edge Add-ons after the listing is approved
- On successful subscription, show a success state without redirecting

Acceptance criteria:

- User can reach Products and Research from the first screen
- Homepage clearly presents Research + Products as the V2 positioning
- If extension continuation is enabled, the page includes a clear install CTA that points to Microsoft Edge Add-ons after approval; before approval it degrades to Product Access
- Page has SEO title and meta description

### 4.2 Research Index `/research`

Purpose: list published research articles.

Required elements:

- Page title
- Short description
- Topic filter
- Article list
- Optional links toward relevant Products or Research categories

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

Purpose: SEO content page, GSC validation surface, and lightweight internal-link bridge.

Required elements:

- Title
- Summary
- Published date
- Main content
- Optional internal links written directly in Markdown
- Optional related research links

Behavior:

- Render content from Markdown
- Use `seo_title` and `seo_description` for metadata
- Do not require a configured article CTA for new posts
- Product promotion should happen through Markdown internal links to `/products`, product pages, research categories, or related articles
- Newsletter / lead magnet / waitlist / demand-association fields are removed from the default V2 publishing flow
- `cta_type` and `cta_target` remain legacy optional data only; they are not shown or required in the Post editor and do not render automatic article CTAs
- Optional `cover_image_url` is retained for social sharing metadata while Research cards stay text-first

Acceptance criteria:

- Article renders Markdown content
- Article can link readers to related products or research pages through normal Markdown links
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

- Microsoft Edge Add-ons for public self-serve distribution
- Product Access / Partner Preview while the listing is under review

Requirements:

- Install CTA is shown only after the user has had a chance to see trial results, or in clearly secondary placement
- CTA opens the Microsoft Edge Add-ons listing after approval
- Page copy must not imply GitHub download or manual unpacked installation
- If the Microsoft Edge Add-ons link is not yet available, CTA should degrade to Product Access rather than newsletter/waitlist language

Acceptance criteria:

- Install CTA can be configured from environment or content config
- Clicks on install CTA are trackable
- User-facing copy matches the current Edge Add-ons state: under review before approval, install after approval

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

- published posts
- LeadRadar workflow opens

Display insight cards:

- article publishing / GSC review reminder
- product movement reminder
- legacy-data hidden reminder

Acceptance criteria:

- Authenticated user can view metrics
- Overview does not show Demand, Subscriber, Resource, or Waitlist modules as V2 core workflow
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
- published_at

Create/edit fields:

- title, required
- slug, required unique
- summary
- content, Markdown
- topic_tag
- seo_title
- seo_description
- status
- published_at

Enums:

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
| topic_tag | text | no | |
| seo_title | text | no | |
| seo_description | text | no | |
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
| `install_clicked` | user clicks the Microsoft Edge Add-ons install CTA after approval |
| `trial_access_requested` | user requests Product Access while the listing is pending or while support is needed |
| `newsletter_signup` | successful subscriber creation |
| `resource_signup` | successful resource form submission |
| `waitlist_signup` | successful waitlist form submission |
| `research_internal_link_click` | user clicks a tracked internal link inside research content, if tracking is enabled |
| `product_page_visit` | user visits a product page from research or navigation |

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
- Public homepage can route qualified users to LeadRadar Product Access while Edge Add-ons is under review, and to Microsoft Edge Add-ons after approval
- Research index renders published posts only
- Research detail renders Markdown, SEO metadata, and internal links
- Legacy resource, newsletter, and waitlist URLs remain reachable or redirected if already public
- About page renders
- Admin login protects admin routes
- Admin can create draft and published posts
- Admin sidebar shows V2 core entries: Overview, Metrics, Post Analytics, Posts, Contacts, Access Leads, Feedback
- Admin can review article views locally and use GSC for search performance
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
