import { db } from "../lib/firebase";
import { generateBlogFromItem } from "../utils/generateBlogLogic";
import { logger } from "firebase-functions";

// 🎯 Cloud Scheduler 用ロジック関数
export const runScheduledBlogMorning = async () => {
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
  const itemCode = doc.get("itemCode");

  if (!itemCode) {
    logger.error("❌ itemCode が存在しません");
    return;
  }

  try {
    const slug = await generateBlogFromItem(itemCode);
    logger.info("✅ ブログ生成完了", { slug });
  } catch (err) {
    logger.error("🚨 ブログ生成中にエラー発生", err);
  }
};
