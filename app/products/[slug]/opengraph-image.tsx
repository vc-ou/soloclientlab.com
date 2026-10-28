import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/domains/catalog";

/**
 * 产品层分享图（按 slug 生成）。
 *
 * 背景：根级 app/opengraph-image.tsx 是「全站默认」，现在已改为主线（solo consultant）口径。
 * 产品页需要保持各自的产品口径，所以在这里按 slug 取商品数据生成，而不是三个商品共用一张 CNC 图。
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = "SoloClientLab product preview";

const CHIP_COLORS = ["#e8efdb", "#e3ecea", "#f0e6ce"];

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const name = product?.name ?? "SoloClientLab";
  const title = product?.hero_title ?? product?.short_description ?? name;
  const body = product?.short_description ?? product?.promise ?? "";
  const chips = (product?.features ?? []).slice(0, 3).map((feature) => feature.title);
  const isManufacturing = slug === "leadradar";

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
          <div style={{ fontSize: 24, color: "#4d635c" }}>{name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 28, color: "#5a6d36", letterSpacing: 2, textTransform: "uppercase" }}>
            {isManufacturing ? "CNC / Manufacturing Lead Generation" : "Focused workflow tool"}
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.06, fontWeight: 800, maxWidth: 960 }}>
            {title.length > 90 ? `${title.slice(0, 88)}…` : title}
          </div>
          {body ? (
            <div style={{ fontSize: 30, lineHeight: 1.25, color: "#42514d", maxWidth: 960 }}>
              {body.length > 130 ? `${body.slice(0, 128)}…` : body}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#31423c" }}>
          {(chips.length ? chips : ["Focused workflow", "Small setup"]).map((chip, index) => (
            <div
              key={chip}
              style={{
                padding: "14px 20px",
                background: CHIP_COLORS[index % CHIP_COLORS.length],
                borderRadius: 999
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
