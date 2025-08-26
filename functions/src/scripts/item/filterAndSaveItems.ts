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

    // --- 特徴抽出 ---
    const featureHighlights = generateFeatureHighlights({
      capacity,
      outputPower,
      weight,
      hasTypeC,
    });

    // ✅ category を utils 側からもらう（後述の utils 変更が前提）
    const {
      tags,
      matchedRules,
      category: ruleCategory,
    } = applyFilterRules(
      {
        capacity,
        outputPower,
        weight,
        hasTypeC,
        itemName: src.itemName,
      },
      itemFilterRules,
    );
    const category = ruleCategory ?? matchedRules[0]?.label ?? "";

    // --- 保存先 doc ---
    const id = doc.id.replace(/:/g, "-"); // 表示・URL用
    const ref = db.collection("monitoredItems").doc(id);

    const now = Timestamp.now();
    const snap = await ref.get();
    const prev = snap.exists ? snap.data() : null;

    // --- 価格決定 & 履歴 ---
    const price: number = typeof src.itemPrice === "number" ? src.itemPrice : 0;
    const prevLast =
      Array.isArray(prev?.priceHistory) && prev!.priceHistory.length
        ? prev!.priceHistory[prev!.priceHistory.length - 1]
        : null;
    const needAppendHistory = !prevLast || prevLast.price !== price;

    const priceHistory = needAppendHistory
      ? [...(prev?.priceHistory ?? []), { date: now, price }]
      : (prev?.priceHistory ?? []);

    // --- AI要約（空なら生成）---
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
        aiSummary = "";
      }
    }

    // ✅ ここで raw の itemCode を持たせる
    const payload = {
      itemCode: doc.id as string, // ← 追加（例: "shop:123"）
      productName: extractShortTitle(src.itemName),
      imageUrl: src.imageUrl ?? "",
      price,
      capacity,
      outputPower,
      weight,
      hasTypeC,
      tags,
      category,
      featureHighlights,
      aiSummary,
      affiliateUrl: src.affiliateUrl ?? "",
      views: prev?.views ?? 0,
      createdAt: prev?.createdAt ?? src.createdAt ?? now,
      updatedAt: now,
      priceHistory,
    };

    await ref.set(payload, { merge: true });
  }
};
