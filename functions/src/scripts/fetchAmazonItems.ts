import * as functions from "firebase-functions";
import { db, Timestamp } from "../lib/firebase";
import { createAmazonClient } from "../utils/paapi";
import { paapiToOffer } from "../utils/amazonAdapter";
import type { Offer } from "../types/monitoredItem";

export const fetchAmazonItems = functions
  .region("asia-northeast1")
  .https.onRequest(async (_req, res) => {
    const enabled = process.env.AMAZON_API_ENABLED === "true";
    if (!enabled) {
      functions.logger.info(
        "[amazon] disabled. set AMAZON_API_ENABLED=true to run",
      );
      res.status(200).send("amazon disabled");
      return;
    }

    const tag = process.env.AMAZON_ASSOC_TAG || "xxxx-22";
    const asins = (process.env.AMAZON_ASIN_LIST || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const client = createAmazonClient({ enabled: true });
    const items = await client.getItems(asins);

    let updated = 0;
    for (const it of items) {
      const offer: Offer = paapiToOffer(it, tag);
      const docId = it.ASIN; // 暫定：ASIN を docId/sku に

      const ref = db.collection("monitoredItems").doc(docId);
      const snap = await ref.get();
      const prev = snap.exists ? (snap.data() as any) : {};

      const prevOffers: Offer[] = Array.isArray(prev?.offers)
        ? prev.offers
        : [];
      const merged = [
        ...prevOffers.filter((o) => o.source !== "amazon"),
        offer,
      ];

      await ref.set(
        {
          sku: prev?.sku ?? it.ASIN,
          productName:
            prev?.productName ?? it.Title ?? `Amazon商品 (${it.ASIN})`,
          imageUrl: prev?.imageUrl ?? it.ImageURL ?? "",
          offers: merged,
          // フォールバック用の旧フィールド（UI後方互換）
          price: typeof prev?.price === "number" ? prev.price : offer.price,
          affiliateUrl: prev?.affiliateUrl ?? offer.url,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      updated++;
    }

    res.status(200).send(`updated=${updated}`);
  });
