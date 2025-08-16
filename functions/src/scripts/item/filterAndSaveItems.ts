// functions/src/scripts/item/filterAndSaveItems.ts
import {
  extractCapacity,
  extractOutputPower,
  extractWeight,
  checkTypeC,
  extractShortTitle,
} from "../../utils/extractSpecs";
import { itemFilterRules } from "../../config/itemFilterRules";
import { applyFilterRules } from "../../utils/applyFilterRules";
import { generateFeatureHighlights } from "../../utils/generateFeatureHighlights";
import { db, Timestamp } from "../../lib/firebase";
import { generateSummaryFromFeatures } from "../../lib/openai";

// ▼ 決め：price を一次フィールドに統一（itemPrice は読み取り時のフォールバックのみ）
export const filterAndSaveItems = async () => {
  const snapshot = await db.collection("rakutenItems").get();

  for (const doc of snapshot.docs) {
    const src = doc.data();
    const description: string = src.description ?? "";

    // --- spec 抽出 ---
    const capacity = extractCapacity(description);
    const outputPower = extractOutputPower(description);
    const weight = extractWeight(description);
    const hasTypeC = checkTypeC(description);

    // --- 目立つ特徴 & タグ/カテゴリ ---
    const featureHighlights = generateFeatureHighlights({
      capacity,
      outputPower,
      weight,
      hasTypeC,
    });

    const { tags, matchedRules } = applyFilterRules(
      { capacity, outputPower, weight, hasTypeC, itemName: src.itemName },
      itemFilterRules,
    );
    const category = matchedRules[0]?.label ?? "";

    // --- 保存先 doc ---
    const id = doc.id.replace(/:/g, "-"); // e.g. "anker:10000641" → "anker-10000641"
    const ref = db.collection("monitoredItems").doc(id);

    const now = Timestamp.now();
    const snap = await ref.get();
    const prev = snap.exists ? snap.data() : null;

    // --- 価格決定 & 履歴重複防止 ---
    const price: number = typeof src.itemPrice === "number" ? src.itemPrice : 0;
    const prevLast =
      Array.isArray(prev?.priceHistory) && prev!.priceHistory.length
        ? prev!.priceHistory[prev!.priceHistory.length - 1]
        : null;
    const needAppendHistory = !prevLast || prevLast.price !== price;

    const priceHistory = needAppendHistory
      ? [...(prev?.priceHistory ?? []), { date: now, price }]
      : (prev?.priceHistory ?? []);

    // --- AI要約（保存時に空なら生成）---
    let aiSummary: string = prev?.aiSummary ?? "";
    if (!aiSummary) {
      const featureText =
        `商品名:${src.itemName}\n` +
        `容量:${capacity ?? "-"}mAh\n` +
        `出力:${outputPower ?? "-"}W\n` +
        `Type-C:${hasTypeC ? "あり" : "なし"}`;
      try {
        aiSummary = await generateSummaryFromFeatures(featureText);
      } catch {
        aiSummary = ""; // 失敗時は空のまま（次回の実行で再挑戦）
      }
    }

    // --- 書き込み本体 ---
    const payload = {
      productName: extractShortTitle(src.itemName),
      imageUrl: src.imageUrl ?? "",
      price, // 一次フィールド
      capacity,
      outputPower,
      weight,
      hasTypeC,
      tags,
      category,
      featureHighlights,
      aiSummary,
      affiliateUrl: src.affiliateUrl ?? "", // 欠損は別タスクで再取得
      views: prev?.views ?? 0,
      createdAt: prev?.createdAt ?? src.createdAt ?? now, // 初回のみ固定
      updatedAt: now,
      priceHistory, // 並び順を保持したまま上書き
    };

    await ref.set(payload, { merge: true });
  }
};
