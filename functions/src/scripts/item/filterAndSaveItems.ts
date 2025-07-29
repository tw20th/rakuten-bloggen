// functions/src/scripts/item/filterAndSaveItems.ts
import { db } from "../../lib/firebase";
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

export const filterAndSaveItems = async () => {
  const snapshot = await db.collection("rakutenItems").get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const description = data.description || "";

    const capacity = extractCapacity(description);
    const outputPower = extractOutputPower(description);
    const weight = extractWeight(description);
    const hasTypeC = checkTypeC(description);

    const featureHighlights = generateFeatureHighlights({
      capacity,
      outputPower,
      weight,
      hasTypeC,
    });

    const { tags, matchedRules } = applyFilterRules(
      {
        capacity,
        outputPower,
        weight,
        hasTypeC,
        itemName: data.itemName,
      },
      itemFilterRules,
    );

    // ✅ カテゴリは最初にマッチしたルールのラベル（なければ空文字）
    const category = matchedRules.length > 0 ? matchedRules[0].label : "";

    const item = {
      productName: extractShortTitle(data.itemName),
      imageUrl: data.imageUrl,
      price: data.itemPrice,
      capacity,
      outputPower,
      weight,
      hasTypeC,
      tags,
      category, // 🆕 カテゴリを追加
      featureHighlights,
      aiSummary: "",
      priceHistory: [
        {
          date: new Date().toISOString(),
          price: data.itemPrice,
        },
      ],
      affiliateUrl: data.affiliateUrl || "",
      views: 0, // 🆕 初期ビュー数を追加
      createdAt: data.createdAt,
      updatedAt: new Date(),
    };

    // IDの整形：「anker:10000641」→「anker-10000641」
    const id = doc.id.replace(/:/g, "-");

    await db.collection("monitoredItems").doc(id).set(item, { merge: true });
  }
};
