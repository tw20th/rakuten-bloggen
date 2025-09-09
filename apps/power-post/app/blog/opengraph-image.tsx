/* eslint-disable @next/next/no-img-element */
// app/blog/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "読みもの一覧";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0b0f16",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, 'Hiragino Kaku Gothic ProN', Meiryo",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, opacity: 0.7, marginBottom: 8 }}>
            ChargeScope
          </div>
          <div style={{ fontSize: 60, fontWeight: 800 }}>読みもの</div>
          <div style={{ fontSize: 22, opacity: 0.85, marginTop: 16 }}>
            価格比較 × 悩み解決のまとめ
          </div>
        </div>
      </div>
    ),
    size
  );
}
