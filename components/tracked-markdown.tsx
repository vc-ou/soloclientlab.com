import ReactMarkdown from "react-markdown";
import { TrackedArticleLink } from "@/components/tracked-article-link";

function isInternalHref(href?: string) {
  if (!href) return false;
  if (href.startsWith("/")) return true;

  try {
    const url = new URL(href);
    return url.hostname === "soloclientlab.com" || url.hostname === "www.soloclientlab.com";
  } catch {
    return false;
  }
}

export function TrackedMarkdown({
  content,
  postId,
  postSlug
}: {
  content: string;
  postId: string;
  postSlug: string;
}) {
  return (
    <ReactMarkdown
      components={{
        h1: "h2",
        a: ({ href, children }) => isInternalHref(href) ? (
          <TrackedArticleLink href={href} postId={postId} postSlug={postSlug}>
            {children}
          </TrackedArticleLink>
        ) : (
          <a href={href}>{children}</a>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
