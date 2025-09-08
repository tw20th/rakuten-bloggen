// functions/src/normalize/normalizeItems.ts
import * as functions from "firebase-functions";
import { db } from "../lib/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { CatalogItem, PricePoint } from "../types/catalog";
import { rakutenAdapter } from "../adapters/rakuten";
import { amazonAdapter } from "../adapters/amazon";

const region = "asia-northeast1";
const JOB_NAME = "normalizeItems";

function mergePriceHistory(
  prev: PricePoint[] = [],
  next: PricePoint,
): PricePoint[] {
  const exists = prev.some(
    (p) =>
      p.source === next.source &&
      p.date.slice(0, 10) === next.date.slice(0, 10),
  );
  return exists ? prev : [...prev, next];
}

// ちょい簡易ロック（重複起動避け）
async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T | void> {
  const lockRef = db.collection("_locks").doc(key);
  const snap = await lockRef.get();
  if (snap.exists) {
    functions.logger.warn(`[${key}] already running. skip.`);
    return;
  }
  await lockRef.set({ startedAt: Timestamp.now() });
  try {
    return await fn();
  } finally {
    await lockRef.delete().catch(() => {});
  }
}

export const normalizeItems = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .region(region)
  .pubsub.schedule("15 6 * * *") // ← 06:15 JST（fetch→filterの後に回す）
  .timeZone("Asia/Tokyo")
  .onRun(async () =>
    withLock(JOB_NAME, async () => {
      const adapters = [rakutenAdapter, amazonAdapter]; // yahooは後で追加
      const nowIso = new Date().toISOString();
      const writer = db.bulkWriter(); // 高速・自動リトライ

      let upserts = 0;

      for (const adp of adapters) {
        const items = await adp.fetchNewItems();
        for (const it of items) {
          const id = it.id; // TODO: 将来は型番/JANの正規化ID
          const ref = db.collection("catalogItems").doc(id);

          const snap = await ref.get();
          const nextPrice: PricePoint | null =
            typeof it.price === "number"
              ? {
                  source: adp.source,
                  price: it.price,
                  date: nowIso,
                  url: it.url,
                }
              : null;

          if (!snap.exists) {
            const doc: Omit<CatalogItem, "createdAt" | "updatedAt"> = {
              id,
              productName: it.productName,
              imageUrl: it.imageUrl,
              specs: it.specs,
              affiliate: {
                rakutenUrl: adp.source === "rakuten" ? it.url : undefined,
                amazonUrl: adp.source === "amazon" ? it.url : undefined,
              },
              priceHistory: nextPrice ? [nextPrice] : [],
              featureHighlights: [],
              tags: [],
              scores: {},
            };
            writer.set(ref, {
              ...doc,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
            upserts++;
          } else {
            const prev = snap.data() as CatalogItem;
            const updatedHistory = nextPrice
              ? mergePriceHistory(prev.priceHistory ?? [], nextPrice)
              : (prev.priceHistory ?? []);

            writer.update(ref, {
              productName: prev.productName || it.productName,
              imageUrl: prev.imageUrl || it.imageUrl,
              specs: { ...(prev.specs ?? {}), ...(it.specs ?? {}) },
              affiliate: {
                ...(prev.affiliate ?? {}),
                ...(adp.source === "rakuten" ? { rakutenUrl: it.url } : {}),
                ...(adp.source === "amazon" ? { amazonUrl: it.url } : {}),
              },
              priceHistory: updatedHistory,
              updatedAt: Timestamp.now(),
            });
            upserts++;
          }
        }
      }

      await writer.close();
      functions.logger.info(`normalizeItems: upserts=${upserts}`);
      return null;
    }),
  );
