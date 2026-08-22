import { AdminShell, FormActions } from "@/components/admin";
import { upsertResource } from "@/lib/actions";
import Link from "next/link";
import { getResourceById, getResourcePerformance } from "@/lib/db";
import { getResourceDeliveryLabel, getResourceDeliveryPath, getResourceLandingPath } from "@/lib/resource-delivery";

type ResourceEditorProps = {
  params: Promise<{ id: string }>;
};

export default async function ResourceEditorPage({ params }: ResourceEditorProps) {
  const { id } = await params;
  const resource = id === "new" ? null : await getResourceById(id);
  const performance = resource
    ? (await getResourcePerformance()).find((item) => item.id === resource.id)
    : null;
  const landingPath = resource ? getResourceLandingPath(resource) : null;
  const deliveryPath = resource ? getResourceDeliveryPath(resource) : null;

  return (
    <AdminShell title={resource ? "编辑辅助页面" : "新建辅助页面"}>
      <form action={upsertResource} className="admin-form">
        <input type="hidden" name="id" value={resource?.id ?? ""} />
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
            <small className="field-help">用于公开辅助页面和站内路由。</small>
          </label>
          <label className="field">
            <span>交付方式</span>
            <select name="delivery_mode" defaultValue={resource?.delivery_mode ?? "page"}>
              <option value="page">页面</option>
              <option value="file">文件</option>
              <option value="external">外部链接</option>
            </select>
            <small className="field-help">页面使用站内页面流程，文件提供下载路径，外部链接打开托管地址。</small>
          </label>
          <label className="field">
            <span>交付 URL / 文件路径</span>
            <input name="delivery_url" defaultValue={resource?.delivery_url ?? ""} />
            <small className="field-help">页面填写站内路径，文件填写公开文件路径，外部链接填写完整网址。</small>
          </label>
        </div>
        {resource ? (
          <section className="admin-card resource-preview-card">
            <div className="resource-preview-header">
              <div>
                <h2>辅助页面预览</h2>
                <p>快速检查辅助订阅或交付流程。</p>
              </div>
              <span className="admin-pill">{performance?.subscriberCount ?? 0} 位联系人</span>
            </div>
            <div className="resource-preview-links">
              {landingPath ? (
                <Link href={landingPath} target="_blank" rel="noreferrer" className="button secondary">
                  打开落地页
                </Link>
              ) : null}
              {deliveryPath ? (
                <Link href={deliveryPath} target="_blank" rel="noreferrer" className="button ghost">
                  {getResourceDeliveryLabel(resource)}
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
