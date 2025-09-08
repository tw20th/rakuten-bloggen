// functions/src/utils/generateBlogLogic.ts
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import { basicSlug, safeTailFromItemCode, shortId } from "../utils/slugify";
import { chatText } from "../lib/openai";
import { resolveCategoryTheme } from "../services/thumbnail";
import {
  generateSpecialThumbnail,
  shouldGenerateSpecialThumbnail,
} from "../services/generateSpecialThumbnail";

// ───────────────────────── helpers ─────────────────────────
function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
const coalesce = (...v: Array<string | undefined | null>) =>
  v.find((x) => (x ?? "").toString().trim().length > 0) ?? "";

function fmtPorts(item: any): string {
  const ps: string[] = [];
  if (item?.hasTypeC) ps.push("USB-C");
  if (item?.hasTypeA) ps.push("USB-A");
  if (item?.hasMicroB) ps.push("micro-B");
  return ps.length ? ps.join(" / ") : toStr(item?.ports ?? "-");
}

function asDash(v: unknown): string {
  const s = toStr(v).trim();
  return s ? s : "-";
}

function readTemplate(core: string, ctx: Record<string, string>): string {
  let out = core;
  for (const [k, v] of Object.entries(ctx)) {
    // ES2021 未満でも動く safe 書き換え
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

async function ensureUniqueSlug(
  base: string,
  itemCode: string,
): Promise<string> {
  let slug = base.slice(0, 60).replace(/-+$/g, "");
  if (!slug) slug = safeTailFromItemCode(itemCode).slice(0, 60);
  const col = db.collection("blogs");
  let final = slug;
  let tries = 0;
  while ((await col.doc(final).get()).exists && tries < 3) {
    const suffix = shortId(`${itemCode}:${tries}`);
    final = `${slug}-${suffix}`.slice(0, 60).replace(/-+$/g, "");
    tries++;
  }
  return final;
}

// ────────────────────── content generator ──────────────────────
async function generateContentMarkdown(args: {
  item: FirebaseFirestore.DocumentData;
  monitored: FirebaseFirestore.DocumentData | null;
}): Promise<string> {
  const { item, monitored } = args;

  const itemName = toStr(item?.itemName);
  const description = toStr(item?.description).slice(0, 800);

  // スペック系は “monitoredItems優先 → item” で取得
  const capacity = coalesce(toStr(monitored?.capacity), toStr(item?.capacity));
  const outputPower = coalesce(
    toStr(monitored?.outputPower),
    toStr(item?.outputPower),
  );
  const weight = coalesce(toStr(monitored?.weight), toStr(item?.weight));
  const ports = fmtPorts(monitored ?? item ?? {});
  const tags: string[] = (monitored?.tags as string[] | undefined) ?? [];

  // テンプレ本文（プロンプト）はテキストファイルから読みたいが、
  // Cloud Functions では import で同梱できるようにするのが簡単。
  // ここでは直書きのフォールバックも用意。
  const CORE_PROMPT = `あなたは日本語のSEOライターです。以下の制約を厳守して、Markdownのみを返します。表現は簡潔・重複回避・一次情報優先。

## TL;DR
- 3行で要点。誰に向く/主な利点/注意点 を1行ずつ

## おすすめ3選（用途別）
- 箇条書き3つ。「○○向け：理由（短く）」の書式。1つは本商品を入れてよい

## 比較表（主要スペック）
|項目|本商品|
|---|---|
|容量|{capacity}|
|最大出力|{outputPower}|
|重量|{weight}|
|端子|{ports}|

※ 不明は「-」と記載

## 選び方の要点（3つ）
- 箇条書き3つ。判断基準を短く

## 価格と在庫の動き
- 直近の価格/在庫の印象を1〜2文（与えられた数値やタグから言い切る）

## よくある質問
- Q&Aを3つ。回答は1〜2文で端的に

## 迷ったらこれ
- 最後に背中を押す1文（具体に）

# 禁止事項
- リンク/URL/コードブロックを出さない
- 事実不明を断定しない（不明の場合は「-」を使う）
- 指定以外の見出しを作らない

# 参照情報（モデルは参考に。無い項目は「-」）
商品名: {itemName}
説明: {description}
容量: {capacity}
最大出力: {outputPower}
重量: {weight}
端子: {ports}
タグ: {tagsCsv}`;

  const prompt = readTemplate(CORE_PROMPT, {
    itemName,
    description,
    capacity: asDash(capacity),
    outputPower: asDash(outputPower),
    weight: asDash(weight),
    ports: asDash(ports),
    tagsCsv: tags.join(","),
  });

  const SYS =
    "あなたは日本語のSEOライターです。結論→要点→比較の順で、重複を避け簡潔に書きます。指定の見出し以外は出力しないでください。";

  const md = await chatText(SYS, prompt, {
    model: "gpt-4o-mini",
    maxTokens: 900,
    temperature: 0.4,
    retries: 2,
  });

  // 念のため：万一モデルが余計な見出しを出したら軽く整形
  return md.replace(/\r\n/g, "\n").trim();
}

// ───────────────────────── main ─────────────────────────
export const generateBlogFromItem = async (
  itemCode: string,
): Promise<string> => {
  logger.info("📝 generateBlogFromItem 実行", { itemCode });

  const itemSnap = await db.collection("rakutenItems").doc(itemCode).get();
  if (!itemSnap.exists) throw new Error(`Item not found: ${itemCode}`);
  const item = itemSnap.data() as FirebaseFirestore.DocumentData;

  const monitoredId = itemCode.replace(/:/g, "-");
  const monitoredSnap = await db
    .collection("monitoredItems")
    .doc(monitoredId)
    .get();
  const monitoredData = monitoredSnap.exists
    ? (monitoredSnap.data() as FirebaseFirestore.DocumentData)
    : null;
  const tags = ((monitoredData?.tags as string[]) ?? []).slice(0);
  const category = toStr(monitoredData?.category);

  // ── 生成本体 ──
  let content = "";
  try {
    content = await generateContentMarkdown({ item, monitored: monitoredData });
  } catch (e: unknown) {
    const err = e as {
      status?: number;
      code?: string;
      error?: { code?: string };
      message?: string;
    };
    logger.error("OpenAI生成に失敗", {
      status: err?.status,
      code: err?.code || err?.error?.code,
      msg: err?.message,
    });
    throw e;
  }

  // スラッグ生成
  const primary = basicSlug(toStr(item?.itemName));
  let slugCandidate = primary;
  if (slugCandidate.length < 8) {
    const tail = safeTailFromItemCode(itemCode);
    slugCandidate = primary ? `${primary}-${tail}` : tail;
  }
  slugCandidate = slugCandidate.slice(0, 60).replace(/-+$/g, "");
  const slug = await ensureUniqueSlug(slugCandidate, itemCode);

  // 画像（元画像）
  const officialImg =
    toStr(monitoredData?.imageUrl) || toStr(item?.imageUrl) || "";

  await db
    .collection("blogs")
    .doc(slug)
    .set({
      slug,
      title: toStr(item?.itemName),
      content,
      status: "draft",
      relatedItemCode: itemCode,
      tags,
      category,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: officialImg, // ↓後でサムネ合成で上書き
    });

  // ── サムネ自動生成（既存ロジックを活かす） ──
  try {
    if (officialImg) {
      const { composeProductThumbnail } = await import("../services/thumbnail");
      const theme = resolveCategoryTheme(category);
      const badgeText =
        (category && category.length <= 10 ? theme.defaultBadge : "") ||
        "おすすめ";

      const baseThumbUrl = await composeProductThumbnail({
        productImageUrl: officialImg,
        titleBadge: badgeText,
        outPath: `thumbnails/blogs/${slug}.png`,
        categoryColorHex: theme.colorHex,
        badgeAlign: "left",
        width: 1200,
        height: 630,
      });

      await db.collection("blogs").doc(slug).set(
        {
          imageUrl: baseThumbUrl,
          heroImageUrl: baseThumbUrl,
          heroCaption: "商品公式画像に背景とラベルを合成（カテゴリ統一）",
          updatedAt: new Date(),
        },
        { merge: true },
      );

      const genSpecial = shouldGenerateSpecialThumbnail({
        item: {
          itemCode,
          itemName: toStr(item?.itemName),
          itemPrice: (item?.itemPrice as number | undefined) ?? undefined,
          imageUrl: officialImg,
          description: toStr(item?.description) || undefined,
        },
        monitored: monitoredData
          ? {
              productName: toStr(monitoredData?.productName) || undefined,
              imageUrl: toStr(monitoredData?.imageUrl) || undefined,
              price: (monitoredData?.price as number | undefined) ?? undefined,
              tags: (monitoredData?.tags as string[] | undefined) ?? undefined,
              category: toStr(monitoredData?.category) || undefined,
              reviewCount:
                (monitoredData?.reviewCount as number | undefined) ?? undefined,
            }
          : undefined,
      });

      if (genSpecial) {
        await generateSpecialThumbnail({
          slug,
          productImageUrl: officialImg,
          category: category || undefined,
          tags: (monitoredData?.tags as string[] | undefined) ?? undefined,
        });
      }
    }
  } catch (e) {
    logger.warn("thumbnail generation failed", {
      slug,
      message: (e as Error).message,
    });
  }

  logger.info("✅ ブログ記事の保存が完了", { slug });
  return slug;
};
