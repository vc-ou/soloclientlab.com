import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/db";
import { labelForTopic } from "@/lib/format";

export const alt = "SoloClientLab research article preview";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

type ImageProps = {
  params: Promise<{ slug: string }>;
};

function clampTitle(title: string) {
  return title.length > 92 ? `${title.slice(0, 89).trim()}...` : title;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8faf7",
          color: "#17231f",
          padding: 72,
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>SoloClientLab</div>
          <div style={{ fontSize: 24, color: "#4d635c" }}>Research guide</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 28, color: "#5a6d36", letterSpacing: 2, textTransform: "uppercase" }}>
            {labelForTopic(post.topic_tag)}
          </div>
          <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
            {clampTitle(post.seo_title ?? post.title)}
          </div>
          {post.summary ? (
            <div style={{ fontSize: 32, lineHeight: 1.25, color: "#42514d", maxWidth: 980 }}>
              {post.summary.length > 150 ? `${post.summary.slice(0, 147).trim()}...` : post.summary}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#31423c" }}>
          <div style={{ padding: "14px 20px", background: "#e8efdb", borderRadius: 999 }}>
            Lead generation
          </div>
          <div style={{ padding: "14px 20px", background: "#e3ecea", borderRadius: 999 }}>
            Demand signals
          </div>
          <div style={{ padding: "14px 20px", background: "#f0e6ce", borderRadius: 999 }}>
            SoloClientLab.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
