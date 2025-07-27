import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebase"; // ✅ Firestoreはここから取得
import { generateBlogFromItem } from "../utils/generateBlogLogic";
import { OPENAI_API_KEY } from "../config/secrets";
import { logger } from "firebase-functions";

export const scheduledBlogMorning = onSchedule(
  {
    schedule: "every day 12:00",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    secrets: [OPENAI_API_KEY],
  },
  async () => {
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
  },
);
