// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge"; // 速い・安い
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        ChargeScope
      </div>
    ),
    { ...size }
  );
}
