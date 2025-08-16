import { db } from "../lib/firebase";
import { generateBlogFromItem } from "../utils/generateBlogLogic";
import { logger } from "firebase-functions";
import { revalidateMany } from "../utils/revalidate"; // ★ 追加

// 🎯 Cloud Scheduler 用ロジック関数
export const runScheduledBlogMorning = async (): Promise<void> => {
  logger.info("⏰ scheduledBlogMorning 開始");

  const snapshot = await db
    .collection("rakutenItems")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    logger.warn("⚠️ 新着商品が見つかりませんでした");
    return;
  }

  const doc = snapshot.docs[0];
  const itemCode = doc.get("itemCode") as string | undefined;

  if (!itemCode) {
    logger.error("❌ itemCode が存在しません");
    return;
  }

  try {
    const slug = await generateBlogFromItem(itemCode);
    logger.info("✅ ブログ生成完了", { slug });

    // ★ 生成直後に ISR をキック（一覧 + 詳細）
    try {
      await revalidateMany(["/blog", `/blog/${slug}`]);
      logger.info("🔁 ISR revalidate queued", {
        paths: ["/blog", `/blog/${slug}`],
      });
    } catch (e) {
      logger.warn("⚠️ ISR revalidate failed", {
        error: (e as Error).message,
        slug,
      });
    }
  } catch (err) {
    logger.error("🚨 ブログ生成中にエラー発生", err as Error);
  }
};
