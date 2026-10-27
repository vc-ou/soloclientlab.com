import { AdminShell, FormActions } from "@/components/admin";
import { upsertResource } from "@/lib/actions";
import Link from "next/link";
import { getResourceById, getResourcePerformance } from "@/lib/domains/content";
import {
  getResourceLandingPath,
  resourcesFrontendNotice,
  resourcesFrontendRetired
} from "@/lib/resource-delivery";

type ResourceEditorProps = {
  params: Promise<{ id: string }>;
};

export default async function ResourceEditorPage({ params }: ResourceEditorProps) {
  const { id } = await params;
  const resource = id === "new" ? null : await getResourceById(id);
  const performance = resource
    ? (await getResourcePerformance()).find((item) => item.id === resource.id)
    : null;
  const landingPath = getResourceLandingPath(resource ?? undefined);

  return (
    <AdminShell title={resource ? "编辑辅助页面" : "新建辅助页面"}>
      <form action={upsertResource} className="admin-form">
        <input type="hidden" name="id" value={resource?.id ?? ""} />
        {resourcesFrontendRetired ? (
          <p className="admin-action-feedback">{resourcesFrontendNotice}</p>
        ) : null}
        <div className="admin-fields-2">
          <label className="field">
            <span>标题</span>
            <input name="title" defaultValue={resource?.title ?? ""} required />
          </label>
          <label className="field">
            <span>Slug（网址标识）</span>
            <input name="slug" defaultValue={resource?.slug ?? ""} required />
          </label>
          <label className="field">
            <span>类型</span>
            <select name="type" defaultValue={resource?.type ?? "report"}>
              {[
                ["report", "报告"],
                ["checklist", "清单"],
                ["template", "模板"],
                ["prompt_pack", "提示词包"]
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>状态</span>
            <select name="status" defaultValue={resource?.status ?? "draft"}>
              {[
                ["draft", "草稿"],
                ["published", "已发布"],
                ["archived", "已归档"]
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>目标人群</span>
            <input name="audience" defaultValue={resource?.audience ?? ""} />
          </label>
          <label className="field">
            <span>关联主题</span>
            <input name="related_topic" defaultValue={resource?.related_topic ?? ""} />
          </label>
          <label className="field">
            <span>落地页 Slug</span>
            <input name="landing_page_slug" defaultValue={resource?.landing_page_slug ?? ""} />
            <small className="field-help">历史字段：公开辅助页面已下线，不再生成 /resources/* 路由。</small>
          </label>
          <label className="field">
            <span>交付方式</span>
            <select name="delivery_mode" defaultValue={resource?.delivery_mode ?? "page"}>
              <option value="page">页面</option>
              <option value="file">文件</option>
              <option value="external">外部链接</option>
            </select>
            <small className="field-help">历史字段：公开交付流程已下线，仅作记录。</small>
          </label>
          <label className="field">
            <span>交付 URL / 文件路径</span>
            <input name="delivery_url" defaultValue={resource?.delivery_url ?? ""} />
            <small className="field-help">历史字段：仅作记录，不会生成可访问链接。</small>
          </label>
        </div>
        {resource ? (
          <section className="admin-card resource-preview-card">
            <div className="resource-preview-header">
              <div>
                <h2>历史配置</h2>
                <p>公开辅助页面已下线，这里只保留历史交付配置与订阅归因数据。</p>
              </div>
              <span className="admin-pill">{performance?.subscriberCount ?? 0} 位联系人</span>
            </div>
            <div className="resource-preview-links">
              {landingPath ? (
                <Link href={landingPath} target="_blank" rel="noreferrer" className="button secondary">
                  打开替代页面（/research）
                </Link>
              ) : null}
            </div>
            <div className="resource-preview-stats">
              <div>
                <strong>{performance?.subscriberCount ?? 0}</strong>
                <span>联系人</span>
              </div>
              <div>
                <strong>{Math.round((performance?.conversionRate ?? 0) * 100)}%</strong>
                <span>转化占比</span>
              </div>
            </div>
          </section>
        ) : null}
        <FormActions />
      </form>
    </AdminShell>
  );
}
