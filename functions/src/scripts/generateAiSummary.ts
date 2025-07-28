import { onRequest } from "firebase-functions/v2/https";
import { db } from "../lib/firebase"; // ✅ 初期化済みのdbを利用
import { logger } from "../utils/logger";
import { generateSummaryFromFeatures } from "../lib/openai";

export const generateAiSummary = onRequest(
  {
    region: "asia-northeast1",
    secrets: ["OPENAI_API_KEY"],
  },
  async (req, res) => {
    try {
      logger.info("🔍 AI要約生成スクリプト開始");

      const snapshot = await db.collection("monitoredItems").get();
      let updatedCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const { aiSummary, productName, capacity, outputPower, hasTypeC } =
          data;

        if (aiSummary && aiSummary.length > 10) {
          continue; // すでに要約あり → スキップ
        }

        const featureText = `
          商品名: ${productName}
          容量: ${capacity}mAh
          出力: ${outputPower}W
          Type-C対応: ${hasTypeC ? "あり" : "なし"}
        `;

        logger.debug(`🧠 要約生成中: ${productName}`);
        const summary = await generateSummaryFromFeatures(featureText.trim());

        await doc.ref.update({ aiSummary: summary });
        updatedCount++;
        logger.success(`✅ 要約生成済: ${productName}`);
      }

      res
        .status(200)
        .json({ message: `完了：${updatedCount} 件を更新しました` });
    } catch (error) {
      logger.error("❌ 要約生成エラー", error);
      res.status(500).json({ error: "要約生成に失敗しました" });
    }
  },
);
