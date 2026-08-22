import { AdminShell } from "@/components/admin";
import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminPostsTable } from "@/components/admin-posts-table";
import { getAdminPosts } from "@/lib/db";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <AdminShell title="文章管理">
      <div className="admin-topbar">
        <p>创建和管理适合搜索及 GSC 查看、并已准备好 SEO 信息的文章。</p>
        <AdminLinkButton
          href="/admin/posts/new"
          idleLabel="新建文章"
          pendingLabel="加载中..."
          className="button primary"
        />
      </div>
      <AdminPostsTable initialPosts={posts} />
    </AdminShell>
  );
}
