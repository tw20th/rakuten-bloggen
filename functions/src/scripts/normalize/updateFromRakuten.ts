import * as functions from "firebase-functions";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

type RakutenRaw = {
  itemCode: string;
  itemPrice?: number;
  availability?: number; // 1:在庫あり / 0:在庫なし
  reviewAverage?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  imageUrl?: string;
  itemName?: string;
};

const toBoolOrNull = (v: unknown): boolean | null =>
  v === 1 ? true : v === 0 ? false : null;

export const updateFromRakuten = functions
  .region("asia-northeast1")
  .pubsub.schedule("every day 06:05") // ← fetchDailyItems(06:00) の直後
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const db = getFirestore();
    const rawSnap = await db.collection("rakutenItems").get();

    let updated = 0;

    for (const doc of rawSnap.docs) {
      const r = doc.data() as RakutenRaw;
      if (!r.itemCode) continue;

      const ref = db.collection("monitoredItems").doc(r.itemCode);
      const beforeSnap = await ref.get();
      if (!beforeSnap.exists) continue;

      const before = beforeSnap.data()!;
      const nowISO = new Date().toISOString();

      const nextPrice =
        typeof r.itemPrice === "number" ? r.itemPrice : before.price;

      const last = Array.isArray(before.priceHistory)
        ? before.priceHistory[before.priceHistory.length - 1]
        : undefined;
      const priceChanged =
        typeof last?.price === "number" ? last.price !== nextPrice : true;

      const payload: Record<string, unknown> = {
        price: nextPrice,
        inStock: toBoolOrNull(r.availability) ?? before.inStock ?? null,
        reviewAverage:
          typeof r.reviewAverage === "number"
            ? r.reviewAverage
            : (before.reviewAverage ?? null),
        reviewCount:
          typeof r.reviewCount === "number"
            ? r.reviewCount
            : (before.reviewCount ?? null),
        affiliateUrl: r.affiliateUrl ?? before.affiliateUrl,
        imageUrl: r.imageUrl ?? before.imageUrl,
        productName: r.itemName ?? before.productName,
        updatedAt: Timestamp.now(),
      };

      if (priceChanged) {
        const hist = Array.isArray(before.priceHistory)
          ? before.priceHistory
          : [];
        hist.push({ date: nowISO, price: nextPrice });
        payload.priceHistory = hist;
      }

      await ref.update(payload);
      updated++;
    }

    functions.logger.info(`updateFromRakuten: updated=${updated}`);
  });
