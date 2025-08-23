// functions/src/seo/generateOgImage.ts
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

// ここで canvas を import しないこと！（遅延読み込みにする）

type TextCtx = {
  measureText: (text: string) => { width: number };
  fillText: (text: string, x: number, y: number) => void;
  fillStyle: string | unknown;
  font: string;
  // drawImage を使うので any で最小限許容（引数側に any を置かない方針）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drawImage?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fillRect?: any;
};

export async function generateOgImageForSlug(args: {
  slug: string;
  title: string;
  image?: string;
}) {
  const { slug, title, image } = args;

  // ⬇️ ここで初めて重いモジュールを読み込む（遅延 import）
  const { createCanvas, loadImage } = await import("canvas");

  const W = 1200;
  const H = 630;

  const canvas = createCanvas(W, H);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = canvas.getContext("2d") as unknown as TextCtx & any;

  // 背景
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);

  // タイトル
  ctx.fillStyle = "#ffffff";
  ctx.font =
    "bold 60px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  wrapText(ctx, title, 80, 180, 680, 70);

  // 商品画像（任意）
  if (image) {
    try {
      const img = await loadImage(image);
      ctx.drawImage(img, W - 520, 90, 420, 420);
    } catch {
      logger.warn("OG: load image failed", { image });
    }
  }

  // ロゴ
  ctx.font = "bold 28px system-ui";
  ctx.fillStyle = "#9dd6ff";
  ctx.fillText("ChargeScope", 80, H - 60);

  const buffer = canvas.toBuffer("image/png");
  const bucket = getStorage().bucket();
  const file = bucket.file(`og/blogs/${slug}.png`);
  await file.save(buffer, { contentType: "image/png", public: true });

  return `https://storage.googleapis.com/${bucket.name}/og/blogs/${encodeURIComponent(
    slug,
  )}.png`;
}

function wrapText(
  ctx: TextCtx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}
