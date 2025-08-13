// functions/src/scripts/item/generateSummaryFunction.ts

import { logger } from "../../utils/logger";
import { db } from "../../lib/firebase";
import { getOpenAIClient } from "../../lib/openai";

// ✅ 共通処理として切り出し（Scheduler でも使用）
export const runGenerateSummaryTask = async (): Promise<void> => {
  const snapshot = await db
    .collection("monitoredItems")
    .where("aiSummary", "==", "")
    .limit(10)
    .get();

  if (snapshot.empty) {
    logger.info("✅ 未生成の aiSummary はありません");
    return;
  }

  const openai = getOpenAIClient();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const featureHighlights: string[] = data.featureHighlights;

    if (!featureHighlights || featureHighlights.length === 0) {
      logger.warn(`⚠️ featureHighlights が未設定: ${doc.id}`);
      continue;
    }

    const prompt = `以下の商品特徴をもとに、ユーザーに伝わる簡潔な要約文（2〜3文）を日本語で作ってください：\n\n${featureHighlights.join(
      "\n",
    )}`;

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "あなたは商品をわかりやすく紹介するプロのライターです。難しい言葉を避け、ユーザーに響く文章を心がけてください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const summary = chat.choices?.[0]?.message?.content?.trim() ?? "";

    if (!summary) {
      logger.warn(`⚠️ 要約が生成されませんでした: ${doc.id}`);
      continue;
    }

    await doc.ref.update({
      aiSummary: summary,
      updatedAt: new Date(),
    });

    logger.success(`✅ ${data.productName} の aiSummary を保存しました`);
  }
};
