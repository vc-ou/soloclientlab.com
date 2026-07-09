import { AdminShell, FormActions } from "@/components/admin";
import { PostEditorFields } from "@/components/post-editor-fields";
import { upsertPost } from "@/lib/actions";
import { getAdminPosts, getAnyPostById, getDemands } from "@/lib/db";

type PostEditorProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function PostEditorPage({ params, searchParams }: PostEditorProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const preferLocal = process.env.NODE_ENV !== "production";
  const [post, demands, posts] = await Promise.all([
    id === "new" ? Promise.resolve(null) : getAnyPostById(id, { preferLocal, timeoutMs: 4000 }).then((item) => item ?? null),
    getDemands({ preferLocal, timeoutMs: 4000 }),
    getAdminPosts()
  ]);

  return (
    <AdminShell title={post ? "Edit Post" : "New Post"}>
      <form action={upsertPost} className="admin-form" encType="multipart/form-data">
        {error ? <p className="admin-action-feedback">{decodeURIComponent(error)}</p> : null}
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <PostEditorFields post={post} demands={demands} posts={posts} />
        <FormActions />
      </form>
    </AdminShell>
  );
}
