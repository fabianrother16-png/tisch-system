import { ImageResponse } from "next/og";
import { company } from "@/lib/content";

// Dynamisch generiertes Social-Sharing-Bild (Open Graph / Twitter Card).
// Wird automatisch von Next.js unter /opengraph-image ausgeliefert.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #3E5B70 0%, #243A4A 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 64,
            height: 64,
            background: "#C1622D",
            borderRadius: 12,
            marginBottom: 32,
          }}
        />
        <div style={{ display: "flex", fontSize: 64, color: "#FBF6EE", fontWeight: 700 }}>
          {company.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#F0BC93",
            marginTop: 16,
            fontFamily: "sans-serif",
          }}
        >
          {company.claim}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#D8E0E7",
            marginTop: 40,
            fontFamily: "sans-serif",
          }}
        >
          Fliesenleger in Dortmund · Bäder · Böden · Terrassen · Naturstein
        </div>
      </div>
    ),
    { ...size }
  );
}
