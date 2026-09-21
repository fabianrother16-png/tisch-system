import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          background: "#1E1A17",
          borderRadius: 10,
          padding: "8px 7px",
        }}
      >
        <div style={{ width: 7, height: 14, background: "#C1502E", opacity: 0.55, borderRadius: 2, display: "flex" }} />
        <div style={{ width: 7, height: 22, background: "#C1502E", opacity: 0.8, borderRadius: 2, display: "flex" }} />
        <div style={{ width: 7, height: 30, background: "#C1502E", borderRadius: 2, display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
