import { notFound } from "next/navigation";
import { AdminShell, FormActions } from "@/components/admin";
import { AdminDemandFields } from "@/components/admin-demand-fields";
import { PostEditorFields } from "@/components/post-editor-fields";
import { upsertDemand, upsertPost } from "@/lib/actions";
import { getAdminPosts, getAnyPostById } from "@/lib/domains/content";
import { getDemandById } from "@/lib/domains/leads";

type ContentEditorProps = {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ContentEditorPage({ params, searchParams }: ContentEditorProps) {
  const { kind, id } = await params;
  const { error } = await searchParams;

  if (kind === "post") {
    const [post, posts] = await Promise.all([
      id === "new" ? Promise.resolve(null) : getAnyPostById(id).then((item) => item ?? null),
      getAdminPosts()
    ]);
    if (id !== "new" && !post) notFound();

    return (
      <AdminShell title={post ? "编辑文章" : "新建文章"}>
        <form action={upsertPost} className="admin-form">
          {error ? <p className="admin-action-feedback">{decodeURIComponent(error)}</p> : null}
          <input type="hidden" name="id" value={post?.id ?? ""} />
          <PostEditorFields post={post} posts={posts} />
          <FormActions />
        </form>
      </AdminShell>
    );
  }

  if (kind === "demand") {
    const demand = id === "new" ? null : (await getDemandById(id)) ?? null;
    if (id !== "new" && !demand) notFound();

    return (
      <AdminShell title={demand ? "编辑需求" : "新建需求"}>
        <form action={upsertDemand} className="admin-form">
          {error ? <p className="admin-action-feedback">{decodeURIComponent(error)}</p> : null}
          <input type="hidden" name="id" value={demand?.id ?? ""} />
          <AdminDemandFields demand={demand} />
          <FormActions />
        </form>
      </AdminShell>
    );
  }

  notFound();
}
