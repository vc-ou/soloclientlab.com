import { AdminShell } from "@/components/admin";
import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminPostsTable } from "@/components/admin-posts-table";
import { getAdminPosts } from "@/lib/db";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <AdminShell title="Article CMS">
      <div className="admin-topbar">
        <p>Create and manage SEO-ready articles for search and GSC review.</p>
        <AdminLinkButton
          href="/admin/posts/new"
          idleLabel="New post"
          pendingLabel="Loading..."
          className="button primary"
        />
      </div>
      <AdminPostsTable initialPosts={posts} />
    </AdminShell>
  );
}
