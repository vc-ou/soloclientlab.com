import type { Resource } from "@/lib/types";

/**
 * 辅助页面（resources）的公开路由已下线：
 * `app/resources/**` 已移除，`next.config.ts` 只保留 `/resources` → `/research` 的 301。
 *
 * 数据库表与后台配置仍然保留（便于以后恢复或做 SEO 迁移），
 * 但这里不能再返回 `/resources/<slug>`，否则后台预览会链到 404。
 */
export const resourcesFrontendRetired = true;

export const resourcesFrontendNotice =
  "公开辅助页面已下线：/resources 与 /resources/* 现在统一 301 到 /research。这里保留配置，用于记录历史交付与后续迁移。";

export function getResourceLandingPath(_resource?: Pick<Resource, "landing_page_slug" | "slug">) {
  return "/research";
}
