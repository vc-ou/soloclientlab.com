import { AdminShell, FormActions } from "@/components/admin";
import { PostEditorFields } from "@/components/post-editor-fields";
import { upsertPost } from "@/lib/actions";
import { getAdminPosts, getAnyPostById } from "@/lib/db";

type PostEditorProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function PostEditorPage({ params, searchParams }: PostEditorProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const preferLocal = process.env.NODE_ENV !== "production";
  const [post, posts] = await Promise.all([
    id === "new" ? Promise.resolve(null) : getAnyPostById(id, { preferLocal, timeoutMs: 4000 }).then((item) => item ?? null),
    getAdminPosts()
  ]);

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
