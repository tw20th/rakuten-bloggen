// functions/src/normalize/projectToMonitoredItems.ts
import * as functions from "firebase-functions";
import { db } from "../lib/firebase";
import { Timestamp } from "firebase-admin/firestore";

const region = "asia-northeast1";
const JOB = "projectToMonitoredItems";
const HIST_MAX = 180;

async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T | void> {
  const ref = db.collection("_locks").doc(key);
  const cur = await ref.get();
  if (cur.exists) {
    functions.logger.warn(`[${key}] already running. skip.`);
    return;
  }
  await ref.set({ startedAt: Timestamp.now() });
  try {
    return await fn();
  } finally {
    await ref.delete().catch(() => {});
  }
}

type Catalog = {
  id: string;
  productName: string;
  imageUrl?: string;
  // v1: specs内の値をフラットに投影する
  specs?: {
    capacity?: number;
    outputPower?: number;
    weight?: number;
    hasTypeC?: boolean;
  };
  priceHistory?: Array<{
    source: "rakuten" | "amazon" | "yahoo";
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
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .region(region)
  .pubsub.schedule("25 6 * * *") // 06:25 JST（normalizeの後）
  .timeZone("Asia/Tokyo")
  .onRun(async () =>
    withLock(JOB, async () => {
      const snap = await db.collection("catalogItems").get();
      const writer = db.bulkWriter();
      const nowTs = Timestamp.now();
      const today = new Date().toISOString().slice(0, 10);

      for (const doc of snap.docs) {
        const c = doc.data() as Catalog;

        // --- ソース別の“最新”を抽出し、当日の最安値を決定 ---
        const latestBySource: Record<
          string,
          { price: number; url: string; date: string } | undefined
        > = {};
        for (const p of (c.priceHistory ?? []).sort((a, b) =>
          a.date.localeCompare(b.date),
        )) {
          latestBySource[p.source] = {
            price: p.price,
            url: p.url,
            date: p.date,
          };
        }
        const latest = Object.values(latestBySource).filter(Boolean) as Array<{
          price: number;
          url: string;
          date: string;
        }>;
        latest.sort((a, b) => a.price - b.price);
        const lowest = latest[0];

        const monRef = db
          .collection("monitoredItems")
          .doc(doc.id.replace(/:/g, "-"));
        const monSnap = await monRef.get();
        const prev = monSnap.exists ? (monSnap.data() as any) : null;

        // --- monitored 用の集約履歴（1日1点：その日の最安値） ---
        const prevHist: Array<{ date: string; price: number }> = Array.isArray(
          prev?.priceHistory,
        )
          ? prev.priceHistory.map((h: any) => ({
              date: String(h?.date),
              price: Number(h?.price ?? 0),
            }))
          : [];
        const last = prevHist[prevHist.length - 1];
        const lastDay = last?.date?.slice(0, 10);
        const needAppend = lowest
          ? !last || lastDay !== today || last.price !== lowest.price
          : false;
        const priceHistory = needAppend
          ? [
              ...prevHist,
              { date: `${today}T00:00:00.000Z`, price: lowest!.price },
            ].slice(-HIST_MAX)
          : prevHist;

        // --- v1フィールドへフラット投影（既存優先で埋める） ---
        const capacity = c.specs?.capacity ?? prev?.capacity ?? null;
        const outputPower = c.specs?.outputPower ?? prev?.outputPower ?? null;
        const weight = c.specs?.weight ?? prev?.weight ?? null;
        const hasTypeC =
          typeof c.specs?.hasTypeC === "boolean"
            ? c.specs!.hasTypeC
            : (prev?.hasTypeC ?? false);

        const createdAt: FirebaseFirestore.Timestamp =
          prev?.createdAt ?? doc.createTime ?? nowTs;

        const imageUrl = c.imageUrl ?? prev?.imageUrl ?? "";
        const productName = c.productName || prev?.productName || "";
        const price = lowest?.price ?? prev?.price ?? 0;
        const affiliateUrl =
          lowest?.url ??
          c.affiliate?.rakutenUrl ??
          c.affiliate?.amazonUrl ??
          prev?.affiliateUrl ??
          "";

        const monitoredV1 = {
          productName,
          imageUrl,
          price,
          capacity,
          outputPower,
          weight,
          hasTypeC,
          tags: c.tags ?? prev?.tags ?? [],
          category: prev?.category ?? "", // 既存を優先（ルールによる分類）
          featureHighlights:
            c.featureHighlights ?? prev?.featureHighlights ?? [],
          aiSummary: prev?.aiSummary ?? "",
          priceHistory,
          affiliateUrl,
          views: prev?.views ?? 0,
          createdAt,
          updatedAt: nowTs,
          inStock: prev?.inStock ?? null,
          reviewAverage: prev?.reviewAverage ?? null,
          reviewCount: prev?.reviewCount ?? null,
        };

        writer.set(monRef, monitoredV1, { merge: true });
      }

      await writer.close();
      functions.logger.info(`[${JOB}] projected=${snap.size} (v1 schema)`);
      return null;
    }),
  );
