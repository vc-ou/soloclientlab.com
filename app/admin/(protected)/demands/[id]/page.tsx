import { AdminShell, FormActions } from "@/components/admin";
import { upsertDemand } from "@/lib/actions";
import { personaOptions, topicOptions } from "@/lib/content";
import { getDemandById } from "@/lib/db";

type DemandEditorProps = {
  params: Promise<{ id: string }>;
};

export default async function DemandEditorPage({ params }: DemandEditorProps) {
  const { id } = await params;
  const demand = id === "new" ? null : await getDemandById(id);

  return (
    <AdminShell title={demand ? "编辑需求" : "新建需求"}>
      <form action={upsertDemand} className="admin-form">
        <input type="hidden" name="id" value={demand?.id ?? ""} />
        <div className="admin-fields-2">
          <label className="field">
            <span>标题</span>
            <input name="title" defaultValue={demand?.title ?? ""} required />
          </label>
          <label className="field">
            <span>状态</span>
            <select name="status" defaultValue={demand?.status ?? "raw"}>
              {[
                ["raw", "原始"],
                ["reviewed", "已复核"],
                ["clustered", "已聚类"],
                ["used_in_post", "已用于文章"],
                ["archived", "已归档"]
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>来源 URL</span>
            <input name="source_url" defaultValue={demand?.source_url ?? ""} />
          </label>
          <label className="field">
            <span>来源平台</span>
            <input name="source_platform" defaultValue={demand?.source_platform ?? ""} />
          </label>
          <label className="field">
            <span>用户类型</span>
            <select name="persona" defaultValue={demand?.persona ?? ""}>
              <option value="">选择用户类型</option>
              {personaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>关键词</span>
            <input name="keyword" defaultValue={demand?.keyword ?? ""} />
          </label>
          <label className="field">
            <span>痛点分</span>
            <input name="pain_score" type="number" min="1" max="5" defaultValue={demand?.pain_score ?? ""} />
          </label>
          <label className="field">
            <span>频次分</span>
            <input name="frequency_score" type="number" min="1" max="5" defaultValue={demand?.frequency_score ?? ""} />
          </label>
          <label className="field">
            <span>支付分</span>
            <input name="payment_score" type="number" min="1" max="5" defaultValue={demand?.payment_score ?? ""} />
          </label>
          <label className="field">
            <span>证据强度</span>
            <select name="evidence_strength" defaultValue={demand?.evidence_strength ?? ""}>
              <option value="">选择</option>
              {[
                ["weak", "弱"],
                ["medium", "中"],
                ["strong", "强"]
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>主题标签</span>
            <select name="topic_tag" defaultValue={demand?.topic_tag ?? ""}>
              <option value="">选择主题</option>
              {topicOptions.filter((option) => option.value !== "all").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>标签</span>
            <input name="tags" defaultValue={demand?.tags?.join(", ") ?? ""} />
            <small className="field-help">使用英文逗号分隔，例如 `client_acquisition, referrals, content`。</small>
          </label>
        </div>
        <label className="field">
          <span>用户原话</span>
          <textarea name="user_quote" rows={4} defaultValue={demand?.user_quote ?? ""} />
        </label>
        <label className="field">
          <span>待完成任务</span>
          <textarea name="job_to_be_done" rows={3} defaultValue={demand?.job_to_be_done ?? ""} />
        </label>
        <label className="field">
          <span>问题阶段</span>
          <input name="problem_stage" defaultValue={demand?.problem_stage ?? ""} />
        </label>
        <label className="field">
          <span>已尝试方案</span>
          <textarea name="solution_attempted" rows={3} defaultValue={demand?.solution_attempted ?? ""} />
        </label>
        <label className="field">
          <span>下一步动作</span>
          <textarea name="next_action" rows={3} defaultValue={demand?.next_action ?? ""} />
          <small className="field-help">记录最清晰的下一步，比如“用于研究文章”“加入引流资源”“探索候补页方向”。</small>
        </label>
        <FormActions />
      </form>
    </AdminShell>
  );
}
