import { ImageResponse } from "next/og";

export const alt = "SoloClientLab LeadRadar preview for CNC and manufacturing lead generation";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
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
          <div style={{ fontSize: 24, color: "#4d635c" }}>LeadRadar</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 28, color: "#5a6d36", letterSpacing: 2, textTransform: "uppercase" }}>
            CNC / Manufacturing Lead Generation
          </div>
          <div style={{ fontSize: 74, lineHeight: 1.04, fontWeight: 800, maxWidth: 920 }}>
            Find buyer intent signals before they disappear.
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.25, color: "#42514d", maxWidth: 920 }}>
            Review sourcing questions, RFQ language, MOQ requests, and public conversations worth following up.
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#31423c" }}>
          <div style={{ padding: "14px 20px", background: "#e8efdb", borderRadius: 999 }}>CNC leads</div>
          <div style={{ padding: "14px 20px", background: "#e3ecea", borderRadius: 999 }}>Buyer intent</div>
          <div style={{ padding: "14px 20px", background: "#f0e6ce", borderRadius: 999 }}>Demand signals</div>
        </div>
      </div>
    ),
    size
  );
}
