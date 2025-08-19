import * as functions from "firebase-functions";
import { db } from "../lib/firebase";

const region = "asia-northeast1";

type Offer = {
  source: "rakuten" | "amazon" | "yahoo";
  price: number;
  url: string;
  inStock?: boolean;
  fetchedAt: string; // ISO
};

type Catalog = {
  id: string;
  productName: string;
  imageUrl?: string;
  specs?: Record<string, unknown>;
  priceHistory?: Array<{
    source: Offer["source"];
    price: number;
    date: string;
    url: string;
  }>;
  affiliate?: { rakutenUrl?: string; amazonUrl?: string; yahooUrl?: string };
  featureHighlights?: string[];
  tags?: string[];
  scores?: Record<string, number>;
  updatedAt: FirebaseFirestore.Timestamp;
};

export const projectToMonitoredItems = functions
  .region(region)
  .pubsub.schedule("every day 07:10")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const snap = await db.collection("catalogItems").get();

    const batch = db.batch();
    for (const doc of snap.docs) {
      const c = doc.data() as Catalog;

      // catalog の最新価格を source ごとに抽出（同日複数回あっても最後を採用）
      const latestBySource: Record<Offer["source"], Offer | undefined> =
        {} as any;
      for (const p of (c.priceHistory ?? []).sort((a, b) =>
        a.date.localeCompare(b.date),
      )) {
        latestBySource[p.source] = {
          source: p.source as Offer["source"],
          price: p.price,
          url: p.url,
          fetchedAt: p.date,
        };
      }

      const offers: Offer[] = Object.values(latestBySource).filter(
        Boolean,
      ) as Offer[];
      const lowest = offers.length
        ? offers.reduce((a, b) => (a.price <= b.price ? a : b))
        : undefined;

      const monitored = {
        productName: c.productName,
        imageUrl: c.imageUrl ?? null,
        specs: c.specs ?? {},
        // 表示に必要な最小限
        price: lowest?.price ?? null,
        affiliateUrl: lowest?.url ?? c.affiliate?.rakutenUrl ?? null,
        offers, // 将来のAggregateOffer用
        featureHighlights: c.featureHighlights ?? [],
        tags: c.tags ?? [],
        scores: c.scores ?? {},
        updatedAt: c.updatedAt,
        createdAt: doc.createTime ?? new Date(),
      };

      batch.set(
        db.collection("monitoredItems").doc(doc.id.replace(/:/g, "-")),
        monitored,
        { merge: true },
      );
    }
    await batch.commit();
    return null;
  });
