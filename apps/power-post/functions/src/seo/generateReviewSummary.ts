import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const generateReviewSummary = functions
  .region("asia-northeast1")
  .pubsub.schedule("every day 07:10")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const db = getFirestore();
    const snap = await db
      .collection("monitoredItems")
      .where("reviewCount", ">", 0)
      .limit(50)
      .get();

    for (const d of snap.docs) {
      const item = d.data();
      const prompt = [
        `商品名: ${item.productName}`,
        `平均評価: ${item.reviewAverage} / 件数: ${item.reviewCount}`,
        `特徴: ${(item.featureHighlights ?? []).join(" / ")}`,
        "",
        "上記をもとに、購入者の声を想起できる100〜140文字の要約を日本語で、断定しすぎず、安心感が出るトーンで1文だけ生成してください。",
      ].join("\n");

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const summary = resp.choices[0]?.message?.content?.trim();
      if (!summary) continue;

      await d.ref.update({ aiSummary: summary });
    }
  });
