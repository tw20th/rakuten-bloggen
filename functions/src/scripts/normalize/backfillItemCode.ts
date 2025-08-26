// functions/src/scripts/normalize/backfillItemCode.ts
import { db, Timestamp } from "../../lib/firebase";
import { logger } from "firebase-functions";

export const backfillItemCode = async () => {
  const mSnap = await db.collection("monitoredItems").get();
  let updated = 0;

  for (const m of mSnap.docs) {
    const d = m.data() as {
      itemCode?: string;
      affiliateUrl?: string;
      productName?: string;
    };
    if (d.itemCode) continue;

    let itemCode: string | null = null;

    // 1) affiliateUrl 一致
    if (d.affiliateUrl) {
      const r = await db
        .collection("rakutenItems")
        .where("affiliateUrl", "==", d.affiliateUrl)
        .limit(1)
        .get();
      if (!r.empty) itemCode = r.docs[0].id;
    }

    // 2) productName 完全一致（保険）
    if (!itemCode && d.productName) {
      const r = await db
        .collection("rakutenItems")
        .where("itemName", "==", d.productName)
        .limit(1)
        .get();
      if (!r.empty) itemCode = r.docs[0].id;
    }

    if (itemCode) {
      await m.ref.update({ itemCode, updatedAt: Timestamp.now() });
      updated++;
    }
  }

  logger.info(`backfillItemCode done. updated=${updated}/${mSnap.size}`);
  return { updated, total: mSnap.size };
};
