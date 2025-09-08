// functions/src/scripts/normalize/fixPriceHistory.ts
import { db as dbAdmin, Timestamp } from "../../lib/firebase";
import { logger } from "firebase-functions";

type PriceHistoryEntry = { date: any; price: any };

const toIsoDayStart = (d: Date) =>
  new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  ).toISOString();

// Firestore Timestamp / number / string / Date を ISO 文字列に“頑丈に”変換
function coerceToIso(input: unknown): string | null {
  try {
    if (!input) return null;

    // Firestore Timestamp?
    if (input instanceof Timestamp) {
      return input.toDate().toISOString();
    }

    // JS Date
    if (input instanceof Date) {
      return input.toISOString();
    }

    // number（epoch ms/sec っぽい）
    if (typeof input === "number") {
      const ms = input > 1e12 ? input : input * 1000;
      return new Date(ms).toISOString();
    }

    // string（ISO/その他）→ new Date でパース
    if (typeof input === "string") {
      const d = new Date(input);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  } catch (_) {
    return null;
  }
  return null;
}

export async function fixPriceHistory(batchSize = 200) {
  const col = dbAdmin.collection("monitoredItems");
  const snap = await col.limit(batchSize).get();

  let fixed = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as {
      priceHistory?: PriceHistoryEntry[];
      price?: number;
    };

    const list = Array.isArray(data.priceHistory) ? data.priceHistory : [];
    if (list.length === 0) continue;

    // 1) まずすべてを ISO 文字列へ強制変換
    const coerced = list
      .map((e) => {
        const iso = coerceToIso(e?.date);
        const price = typeof e?.price === "number" ? e.price : Number(e?.price);
        if (!iso || Number.isNaN(price)) return null;
        return { date: iso, price };
      })
      .filter((x): x is { date: string; price: number } => !!x);

    if (coerced.length === 0) {
      logger.warn(`priceHistory empty after coerce: ${doc.id}`);
      continue;
    }

    // 2) 日単位で最安に集約
    const byDay = new Map<string, number>();
    for (const e of coerced) {
      const day = toIsoDayStart(new Date(e.date));
      const prev = byDay.get(day);
      if (prev === undefined || e.price < prev) byDay.set(day, e.price);
    }

    const normalized = [...byDay.entries()]
      .map(([day, p]) => ({ date: day, price: p }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 3) 現在 price と末尾乖離あれば追記
    const last = normalized[normalized.length - 1];
    if (typeof data.price === "number" && last && last.price !== data.price) {
      normalized.push({ date: toIsoDayStart(new Date()), price: data.price });
    }

    await doc.ref.update({ priceHistory: normalized });
    fixed++;
  }

  logger.info(`fixPriceHistory: normalized ${fixed}/${snap.size}`);
}
