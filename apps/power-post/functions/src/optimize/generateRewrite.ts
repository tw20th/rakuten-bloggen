import { db } from "../lib/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { chatJson } from "../lib/openai";
import { revalidateMany } from "../seo/triggerRevalidate";

type Args = { max?: number; minAgeDays?: number };

const SYS =
  "あなたはSEO編集者です。検索意図に合致し、クリックを促すタイトルと、導入～見出し3つの改善案を日本語で短く出力してください。";

// リライト候補抽出 → 改善案保存 → サムネ再生成 → 再検証
export async function generateRewrite({ max = 3, minAgeDays = 3 }: Args = {}) {
  const since = new Date(Date.now() - minAgeDays * 86400000);

  const q = await db
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("views", "asc")
    .limit(max)
    .get();

  if (q.empty) return [];

  const updatedSlugs: string[] = [];

  for (const doc of q.docs) {
    const b = doc.data() as {
      slug: string;
      title: string;
      content: string;
      createdAt?: FirebaseFirestore.Timestamp;
      relatedItemCode?: string;
    };

    if (b.createdAt && b.createdAt.toDate() > since) continue;

    // --- 改善案生成 ---
    const prompt = [
      `既存タイトル: ${b.title}`,
      `本文冒頭: ${(b.content || "").slice(0, 600)}`,
      "",
      '出力JSON: {"title":"...","intro":"...","h2":["...","...","..."],"reason":"..."}',
    ].join("\n");

    const out = await chatJson(SYS, prompt);

    await doc.ref.set(
      {
        rewriteSuggestion: {
          ...out,
          updatedAt: Timestamp.now(),
          source: "auto",
        },
      },
      { merge: true },
    );

    // --- サムネ再生成（公式画像ベース） ---
    try {
      if (b.relatedItemCode) {
        const itemSnap = await db
          .collection("rakutenItems")
          .doc(b.relatedItemCode)
          .get();
        const officialImg =
          (itemSnap.data()?.imageUrl as string | undefined) ?? "";
        if (officialImg) {
          const { composeProductThumbnail } = await import(
            "../services/thumbnail"
          );
          const thumbUrl = await composeProductThumbnail({
            productImageUrl: officialImg,
            titleBadge: "リライト版",
            outPath: `thumbnails/blogs/${b.slug}.png`,
          });
          await doc.ref.set(
            {
              heroImageUrl: thumbUrl,
              heroCaption: "画像：商品公式を加工（背景合成）",
              updatedAt: Timestamp.now(),
            },
            { merge: true },
          );
        }
      }
    } catch (e) {
      console.warn("rewrite thumbnail failed", b.slug, (e as Error).message);
    }

    updatedSlugs.push(b.slug);
  }

  // /blog および各詳細を再検証
  await revalidateMany(["/blog", ...updatedSlugs.map((s) => `/blog/${s}`)]);
  return updatedSlugs;
}
