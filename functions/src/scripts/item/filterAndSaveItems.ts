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

    const item = {
      productName: extractShortTitle(data.itemName),
      imageUrl: data.imageUrl,
      price: data.itemPrice,
      capacity,
      outputPower,
      weight,
      hasTypeC,
      tags: applyFilterRules(
        {
          capacity,
          outputPower,
          weight,
          hasTypeC,
          itemName: data.itemName,
        },
        itemFilterRules,
      ),
      featureHighlights,
      aiSummary: "",
      priceHistory: [
        {
          date: new Date().toISOString(),
          price: data.itemPrice,
        },
      ],
      affiliateUrl: data.affiliateUrl || "",
      createdAt: data.createdAt,
      updatedAt: new Date(),
    };

    // 🔁 IDの変換：「anker:10000641」→「anker-10000641」
    const id = doc.id.replace(/:/g, "-");

    await db.collection("monitoredItems").doc(id).set(item, { merge: true });
  }
};
