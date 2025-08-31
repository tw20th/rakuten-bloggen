// functions/src/utils/generateBlogLogic.ts
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import { basicSlug, safeTailFromItemCode, shortId } from "../utils/slugify";
import { chatText } from "../lib/openai"; // ★ これを使う
import { resolveCategoryTheme } from "../services/thumbnail";
import {
  generateSpecialThumbnail,
  shouldGenerateSpecialThumbnail,
} from "../services/generateSpecialThumbnail";

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

export const generateBlogFromItem = async (
  itemCode: string,
): Promise<string> => {
  logger.info("📝 generateBlogFromItem 実行", { itemCode });

  const itemSnap = await db.collection("rakutenItems").doc(itemCode).get();
  if (!itemSnap.exists) throw new Error(`Item not found: ${itemCode}`);
  const item = itemSnap.data();

  const monitoredId = itemCode.replace(/:/g, "-");
  const monitoredSnap = await db
    .collection("monitoredItems")
    .doc(monitoredId)
    .get();
  const monitoredData = monitoredSnap.exists ? monitoredSnap.data() : {};
  const tags = (monitoredData?.tags as string[] | undefined) ?? [];
  const category = (monitoredData?.category as string | undefined) ?? "";

  // --- コンテンツ生成（軽量モデル + 上限固定） ---
  const SYS =
    "あなたは日本語のSEOライターです。読者の悩みを先読みし、結論→要点→比較→FAQの順で、重複を避け簡潔に書きます。";
  const prompt = [
    `商品名: ${item?.itemName ?? ""}`,
    `説明: ${(item?.description ?? "").slice(0, 800)}`,
    "",
    "出力要件:",
    "- 導入（2-3文）",
    "- おすすめ3行（箇条書き）",
    "- 仕様表（主要3〜5項目）",
    "- Pros/Cons（各3）",
    "- 代替候補（2-3件、対象読者を一言）",
    "- FAQ（3件）",
    "- 最後に購入判断の一文",
  ].join("\n");

  let content = "";
  try {
    content = await chatText(SYS, prompt, {
      model: "gpt-4o-mini",
      maxTokens: 800,
      temperature: 0.5,
      retries: 2,
    });
  } catch (e: any) {
    logger.error("OpenAI生成に失敗", {
      status: e?.status,
      code: e?.code || e?.error?.code,
      msg: e?.message,
    });
    throw e; // ← ここは“生成できる状態に戻す”方針なので敢えてthrow
  }

  const primary = basicSlug((item?.itemName as string) || "");
  let slugCandidate = primary;
  if (slugCandidate.length < 8) {
    const tail = safeTailFromItemCode(itemCode);
    slugCandidate = primary ? `${primary}-${tail}` : tail;
  }
  slugCandidate = slugCandidate.slice(0, 60).replace(/-+$/g, "");
  const slug = await ensureUniqueSlug(slugCandidate, itemCode);

  await db
    .collection("blogs")
    .doc(slug)
    .set({
      slug,
      title: item?.itemName ?? "",
      content,
      status: "draft",
      relatedItemCode: itemCode,
      tags,
      category,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl:
        (monitoredData?.imageUrl as string | undefined) ||
        (item?.imageUrl as string | undefined) ||
        "",
    });

  // ★ サムネ自動生成（あなたの既存ロジックそのまま）
  try {
    const officialImg =
      (monitoredData?.imageUrl as string | undefined) ||
      (item?.imageUrl as string | undefined) ||
      "";

    if (officialImg) {
      const { composeProductThumbnail } = await import("../services/thumbnail");

      const theme = resolveCategoryTheme(category);
      const badgeText =
        (category && category.length <= 10 ? theme.defaultBadge : "") ||
        "おすすめ";

      // まずはカテゴリ統一サムネ（SEOの土台）
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

      // 条件に一致したら Discover 向け個別サムネで上書き
      const genSpecial = shouldGenerateSpecialThumbnail({
        item: {
          itemCode,
          itemName: (item?.itemName as string) || "",
          itemPrice: (item?.itemPrice as number | undefined) ?? undefined,
          imageUrl: officialImg,
          description: (item?.description as string | undefined) ?? undefined,
          createdAt: undefined,
          updatedAt: undefined,
        },
        monitored: {
          productName:
            (monitoredData?.productName as string | undefined) ?? undefined,
          imageUrl:
            (monitoredData?.imageUrl as string | undefined) ?? undefined,
          price: (monitoredData?.price as number | undefined) ?? undefined,
          tags: (monitoredData?.tags as string[] | undefined) ?? undefined,
          category:
            (monitoredData?.category as string | undefined) ?? undefined,
          reviewCount:
            (monitoredData?.reviewCount as number | undefined) ?? undefined,
          createdAt: undefined,
          updatedAt: undefined,
        },
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
