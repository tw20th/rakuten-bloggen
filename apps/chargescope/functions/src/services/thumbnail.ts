/* functions/src/services/thumbnail.ts */
import Sharp from "sharp";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { upgradeProductImageUrl } from "./imageUrl"; // ★ 追加

/** バッジの配置 */
type BadgeAlign = "left" | "right";

/** サムネ生成の入力 */
type ComposeOptions = {
  productImageUrl: string; // 公式画像（楽天/amazon）
  titleBadge: string; // バッジ文言（例: "軽量", "大容量"）
  outPath: string; // Storage 保存先（例: thumbnails/blogs/slug.png）
  categoryColorHex?: string; // バッジ枠/影の色
  badgeAlign?: BadgeAlign; // 左右
  width?: number; // 既定: 1200
  height?: number; // 既定: 630
};

/** カテゴリ用テーマ */
export type CategoryTheme = {
  name: string;
  colorHex: `#${string}`;
  defaultBadge: string;
};

/** カテゴリ → テーマ色マップ（必要に応じて増やしてOK） */
export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  軽量: { name: "軽量", colorHex: "#3182ce", defaultBadge: "軽量" },
  大容量: { name: "大容量", colorHex: "#2f855a", defaultBadge: "大容量" },
  急速充電: { name: "急速充電", colorHex: "#c05621", defaultBadge: "急速充電" },
  耐久: { name: "耐久", colorHex: "#805ad5", defaultBadge: "耐久" },
};

export function resolveCategoryTheme(
  category: string | undefined,
): CategoryTheme {
  if (category && CATEGORY_THEME[category]) return CATEGORY_THEME[category];
  return { name: "おすすめ", colorHex: "#222222", defaultBadge: "おすすめ" };
}

const storage = new Storage();
const BUCKET =
  process.env.STORAGE_BUCKET ||
  `${process.env.GCLOUD_PROJECT || "rakuten-bloggen"}.appspot.com`;

/** Storage にアップロードし、公開URL（token付）を返す */
async function uploadToStorage(
  buffer: Buffer,
  outPath: string,
): Promise<string> {
  const bucket = storage.bucket(BUCKET);
  const file = bucket.file(outPath);
  const token = uuidv4();

  await file.save(buffer, {
    contentType: "image/png",
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
    resumable: false,
    validation: "crc32c",
  });

  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
    outPath,
  )}?alt=media&token=${token}`;
}

/**
 * 商品画像ベースで「自然な」OGPサムネを生成
 * - 背景：オフホワイト + ごく薄いグラデ（SVG）
 * - 商品：中心やや右、被写体を大きく（cover 寄り）
 * - バッジ：左上/右上の角丸ピル
 */
export async function composeProductThumbnail(opts: {
  productImageUrl: string;
  titleBadge: string;
  outPath: string;
  categoryColorHex?: string;
  badgeAlign?: "left" | "right";
  width?: number;
  height?: number;
}): Promise<string> {
  const {
    productImageUrl,
    titleBadge,
    outPath,
    categoryColorHex = "#222222",
    badgeAlign = "left",
    width = 1200,
    height = 630,
  } = opts;

  // 0) URLを高解像度に昇格
  const hiUrl = upgradeProductImageUrl(productImageUrl);

  // 1) 画像取得 → メタ取得
  const res = await fetch(hiUrl);
  if (!res.ok) throw new Error(`failed to fetch product image: ${res.status}`);
  const srcBuf = Buffer.from(await res.arrayBuffer());

  let src = Sharp(srcBuf);
  const meta = await src.metadata();

  // 2) 余白トリム（白背景想定）→ 失敗しても継続
  try {
    // 白フチ前提での余白トリム（失敗しても続行）
    src = src.trim({ threshold: 8, background: "#ffffff" });
  } catch {
    // 型・実装差異で落ちる環境向けフォールバック
    try {
      src = src.trim();
    } catch {}
  }

  // 3) 背景（ベース + ぼかし）
  const baseBg = await Sharp({
    create: { width, height, channels: 4, background: "#f6f1e9ff" },
  })
    .png()
    .toBuffer();

  // 元画像を拡大→ぼかし→暗めオーバーレイで“馴染ませる”
  const blurBg = await Sharp(srcBuf)
    .resize({ width, height, fit: "cover" })
    .blur(25)
    .modulate({ brightness: 0.98, saturation: 0.9 })
    .png()
    .toBuffer();

  const gradientSvg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.06"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient></defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
    </svg>`,
  );

  let bg = await Sharp(baseBg)
    .composite([
      { input: blurBg, left: 0, top: 0 },
      { input: gradientSvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  // 4) レイアウト選択：小さい画像は「カード型」、十分大きければ「ヒーロー型」
  const isTiny = (meta.width ?? 0) < 600 || (meta.height ?? 0) < 600;

  // 商品画像（共通の高品質リサイズ）
  const productBuf = await src
    .resize({
      width: isTiny ? Math.round(width * 0.32) : Math.round(width * 0.62),
      height: isTiny ? Math.round(height * 0.48) : Math.round(height * 0.84),
      fit: "cover",
      position: "attention",
      withoutEnlargement: false,
      kernel: Sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  // 影
  const shadow = await Sharp({
    create: {
      width: isTiny ? Math.round(width * 0.34) : Math.round(width * 0.64),
      height: isTiny ? Math.round(height * 0.5) : Math.round(height * 0.86),
      channels: 4,
      background: "#00000022",
    },
  })
    .blur(25)
    .png()
    .toBuffer();

  // バッジ
  const badgePaddingX = 36;
  const badgePaddingY = 32;
  const safeText = titleBadge.slice(0, 16);
  const badgeSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8"
            flood-color="${categoryColorHex}" flood-opacity="0.15"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <rect x="${badgeAlign === "left" ? badgePaddingX : width - badgePaddingX - 520}"
              y="${badgePaddingY}"
              rx="20" ry="20" width="520" height="96"
              fill="#ffffffdd" stroke="${categoryColorHex}" stroke-width="2"/>
        <text x="${badgeAlign === "left" ? badgePaddingX + 32 : width - badgePaddingX - 520 + 32}"
              y="${badgePaddingY + 64}"
              font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif"
              font-size="48" font-weight="700" fill="#222">${safeText}</text>
      </g>
    </svg>
  `);

  // 5) 位置（カード型=左上ブロック、ヒーロー型=右寄せ大）
  const productLeft = isTiny
    ? Math.round(width * 0.085)
    : Math.round(width * 0.52);
  const productTop = isTiny
    ? Math.round(height * 0.22)
    : Math.round(height * 0.08);

  const composed = await Sharp(bg)
    .composite([
      {
        input: shadow,
        left: productLeft - 24,
        top: productTop + (isTiny ? 8 : 20),
      },
      { input: productBuf, left: productLeft, top: productTop },
      { input: badgeSvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return uploadToStorage(composed, outPath);
}
