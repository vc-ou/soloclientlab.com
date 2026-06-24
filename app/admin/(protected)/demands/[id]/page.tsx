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
    <AdminShell title={demand ? "Edit Demand" : "New Demand"}>
      <form action={upsertDemand} className="admin-form">
        <input type="hidden" name="id" value={demand?.id ?? ""} />
        <div className="admin-fields-2">
          <label className="field">
            <span>Title</span>
            <input name="title" defaultValue={demand?.title ?? ""} required />
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={demand?.status ?? "raw"}>
              {["raw", "reviewed", "clustered", "used_in_post", "archived"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Source URL</span>
            <input name="source_url" defaultValue={demand?.source_url ?? ""} />
          </label>
          <label className="field">
            <span>Source platform</span>
            <input name="source_platform" defaultValue={demand?.source_platform ?? ""} />
          </label>
          <label className="field">
            <span>Persona</span>
            <select name="persona" defaultValue={demand?.persona ?? ""}>
              <option value="">Select persona</option>
              {personaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Keyword</span>
            <input name="keyword" defaultValue={demand?.keyword ?? ""} />
          </label>
          <label className="field">
            <span>Pain score</span>
            <input name="pain_score" type="number" min="1" max="5" defaultValue={demand?.pain_score ?? ""} />
          </label>
          <label className="field">
            <span>Frequency score</span>
            <input name="frequency_score" type="number" min="1" max="5" defaultValue={demand?.frequency_score ?? ""} />
          </label>
          <label className="field">
            <span>Payment score</span>
            <input name="payment_score" type="number" min="1" max="5" defaultValue={demand?.payment_score ?? ""} />
          </label>
          <label className="field">
            <span>Evidence strength</span>
            <select name="evidence_strength" defaultValue={demand?.evidence_strength ?? ""}>
              <option value="">Select</option>
              {["weak", "medium", "strong"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Topic tag</span>
            <select name="topic_tag" defaultValue={demand?.topic_tag ?? ""}>
              <option value="">Select topic</option>
              {topicOptions.filter((option) => option.value !== "all").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tags</span>
            <input name="tags" defaultValue={demand?.tags?.join(", ") ?? ""} />
            <small className="field-help">Use comma-separated tags like `client_acquisition, referrals, content`.</small>
          </label>
        </div>
        <label className="field">
          <span>User quote</span>
          <textarea name="user_quote" rows={4} defaultValue={demand?.user_quote ?? ""} />
        </label>
        <label className="field">
          <span>Job to be done</span>
          <textarea name="job_to_be_done" rows={3} defaultValue={demand?.job_to_be_done ?? ""} />
        </label>
        <label className="field">
          <span>Problem stage</span>
          <input name="problem_stage" defaultValue={demand?.problem_stage ?? ""} />
        </label>
        <label className="field">
          <span>Solution attempted</span>
          <textarea name="solution_attempted" rows={3} defaultValue={demand?.solution_attempted ?? ""} />
        </label>
        <label className="field">
          <span>Next action</span>
          <textarea name="next_action" rows={3} defaultValue={demand?.next_action ?? ""} />
          <small className="field-help">Capture the clearest next move, like “Use in research post”, “Add to lead magnet”, or “Explore waitlist angle”.</small>
        </label>
        <FormActions />
      </form>
    </AdminShell>
  );
}
