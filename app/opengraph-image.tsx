import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SICHTWERK – Digitale Sichtbarkeit für den Mittelstand";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1E1A17",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 44, height: 44, display: "flex" }}>
            <div
              style={{
                position: "absolute",
                width: 16,
                height: 40,
                background: "#C1502E",
                borderRadius: 4,
                transform: "rotate(-16deg)",
                left: 14,
                display: "flex",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 16,
                height: 40,
                background: "#C1502E",
                opacity: 0.55,
                borderRadius: 4,
                transform: "rotate(16deg)",
                left: 14,
                display: "flex",
              }}
            />
          </div>
          <span style={{ color: "#F5F1E8", fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>
            SICHTWERK
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ color: "#F5F1E8", fontSize: 58, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, display: "flex" }}>
            Digitale Sichtbarkeit
          </span>
          <span style={{ color: "#C1502E", fontSize: 58, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, display: "flex" }}>
            für den Mittelstand
          </span>
        </div>
        <span style={{ color: "#DCD2B8", fontSize: 24, display: "flex" }}>
          Marketing-Agentur aus Gütersloh
        </span>
      </div>
    ),
    { ...size }
  );
}
