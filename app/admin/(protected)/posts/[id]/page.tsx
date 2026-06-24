import { AdminShell, FormActions } from "@/components/admin";
import { PostEditorFields } from "@/components/post-editor-fields";
import { upsertPost } from "@/lib/actions";
import { getAnyPostById, getDemands } from "@/lib/db";

type PostEditorProps = {
  params: Promise<{ id: string }>;
};

export default async function PostEditorPage({ params }: PostEditorProps) {
  const { id } = await params;
  const post = id === "new" ? null : (await getAnyPostById(id, { preferLocal: true, timeoutMs: 1500 })) ?? null;
  const demands = await getDemands({ preferLocal: id === "new", timeoutMs: 1500 });

  return (
    <AdminShell title={post ? "Edit Post" : "New Post"}>
      <form action={upsertPost} className="admin-form" encType="multipart/form-data">
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <PostEditorFields post={post} demands={demands} />
        <FormActions />
      </form>
    </AdminShell>
  );
}
