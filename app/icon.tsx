import { ImageResponse } from "next/og";

// Dynamisch generiertes Favicon – kein Bild-Asset nötig.
// Farben/Form hier anpassen, wenn sich das Logo ändert.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3E5B70",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 30,
            height: 30,
            background: "#C1622D",
            borderRadius: 6,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
