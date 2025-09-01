// functions/src/scripts/migrations/backfillOffersAndSku.ts
import { db, Timestamp } from "../../lib/firebase";
import type { Offer } from "../../types/monitoredItem";

// 既存 monitoredItems を走査し、楽天の単価・URLから offers[] を構築。
// ついでに sku（当面は itemCode を流用）も付与。
export const backfillOffersAndSku = async (): Promise<{
  updated: number;
  skipped: number;
}> => {
  const snap = await db.collection("monitoredItems").get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const d = doc.data();

    // 既に offers が存在するならスキップ（必要に応じて条件を緩めてOK）
    if (Array.isArray(d.offers) && d.offers.length > 0) {
      skipped++;
      continue;
    }

    // 楽天の一次フィールドからオファーを構築
    const priceRaw = typeof d.price === "number" ? d.price : null;
    const urlRaw = typeof d.affiliateUrl === "string" ? d.affiliateUrl : null;
    if (priceRaw == null || !urlRaw) {
      skipped++;
      continue;
    }

    const nowISO = new Date().toISOString();
    const offer: Offer = {
      source: "rakuten",
      price: priceRaw,
      url: urlRaw,
      fetchedAt: nowISO,
      // 未設定は true に寄せる（在庫不明で非表示よりは導線を優先）
      inStock: typeof d.inStock === "boolean" ? d.inStock : true,
    };

    // sku: 暫定で itemCode を採用（将来 ASIN に置換）
    const sku: string =
      typeof d.itemCode === "string" && d.itemCode.length > 0
        ? d.itemCode
        : doc.id.replace(/:/g, "-");

    await doc.ref.set(
      {
        sku,
        offers: [offer],
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    updated++;
  }

  return { updated, skipped };
};

// Node 直実行
if (require.main === module) {
  backfillOffersAndSku()
    .then((r) => {
      // eslint-disable-next-line no-console
      console.log(
        `[backfillOffersAndSku] updated=${r.updated} skipped=${r.skipped}`,
      );
      process.exit(0);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    });
}
