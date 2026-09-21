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
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1E1A17",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 9,
            height: 38,
            background: "#C1502E",
            borderRadius: 3,
            transform: "rotate(-16deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 9,
            height: 38,
            background: "#C1502E",
            opacity: 0.55,
            borderRadius: 3,
            transform: "rotate(16deg)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
