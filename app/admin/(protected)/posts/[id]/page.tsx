import { AdminShell, FormActions } from "@/components/admin";
import { PostEditorFields } from "@/components/post-editor-fields";
import { upsertPost } from "@/lib/actions";
import { getAnyPostById, getDemands } from "@/lib/db";

type PostEditorProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function PostEditorPage({ params, searchParams }: PostEditorProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const preferLocal = process.env.NODE_ENV !== "production";
  const post = id === "new"
    ? null
    : (await getAnyPostById(id, { preferLocal, timeoutMs: 4000 })) ?? null;
  const demands = await getDemands({ preferLocal, timeoutMs: 4000 });

  return (
    <AdminShell title={post ? "Edit Post" : "New Post"}>
      <form action={upsertPost} className="admin-form" encType="multipart/form-data">
        {error ? <p className="admin-action-feedback">{decodeURIComponent(error)}</p> : null}
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <PostEditorFields post={post} demands={demands} />
        <FormActions />
      </form>
    </AdminShell>
  );
}
