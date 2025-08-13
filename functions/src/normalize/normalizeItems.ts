import * as functions from "firebase-functions";
import { db } from "../lib/firebase";
import { CatalogItem, PricePoint } from "../types/catalog";
import { rakutenAdapter } from "../adapters/rakuten";
import { amazonAdapter } from "../adapters/amazon";

const region = "asia-northeast1";

function mergePriceHistory(prev: PricePoint[], next: PricePoint): PricePoint[] {
  const exists = prev.some(
    (p) =>
      p.source === next.source &&
      p.date.slice(0, 10) === next.date.slice(0, 10),
  );
  return exists ? prev : [...prev, next];
}

export const normalizeItems = functions
  .region(region)
  .pubsub.schedule("every day 07:00") // 取得後に正規化
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const adapters = [rakutenAdapter, amazonAdapter]; // yahooは後で追加
    const nowIso = new Date().toISOString();

    for (const adp of adapters) {
      const items = await adp.fetchNewItems();
      for (const it of items) {
        const id = it.id; // 将来は型番/JANで正規化ID生成
        const ref = db.collection("catalogItems").doc(id);
        const snap = await ref.get();

        const priceHistory: PricePoint[] = [];
        if (it.price !== undefined) {
          priceHistory.push({
            source: adp.source,
            price: it.price,
            date: nowIso,
            url: it.url,
          });
        }

        if (!snap.exists) {
          const doc: Omit<CatalogItem, "createdAt" | "updatedAt"> = {
            id,
            productName: it.productName,
            imageUrl: it.imageUrl,
            priceHistory,
            specs: it.specs,
            affiliate: {
              rakutenUrl: adp.source === "rakuten" ? it.url : undefined,
              amazonUrl: adp.source === "amazon" ? it.url : undefined,
            },
            featureHighlights: [],
            tags: [],
            scores: {},
          };
          await ref.set({
            ...doc,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          const prev = snap.data() as CatalogItem;
          const updatedHistory =
            priceHistory.length && priceHistory[0]
              ? mergePriceHistory(prev.priceHistory ?? [], priceHistory[0])
              : (prev.priceHistory ?? []);

          await ref.update({
            productName: prev.productName || it.productName,
            imageUrl: prev.imageUrl || it.imageUrl,
            specs: { ...(prev.specs ?? {}), ...(it.specs ?? {}) },
            affiliate: {
              ...(prev.affiliate ?? {}),
              ...(adp.source === "rakuten" ? { rakutenUrl: it.url } : {}),
              ...(adp.source === "amazon" ? { amazonUrl: it.url } : {}),
            },
            priceHistory: updatedHistory,
            updatedAt: new Date(),
          });
        }
      }
    }
    return null;
  });
