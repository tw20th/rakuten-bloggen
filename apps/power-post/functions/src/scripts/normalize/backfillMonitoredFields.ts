// functions/src/scripts/normalize/backfillMonitoredFields.ts
import { db as dbAdmin, Timestamp } from "../../lib/firebase";
import { logger } from "firebase-functions";
import { fixPriceHistory } from "./fixPriceHistory";
import { applyFilterRules } from "../../utils/applyFilterRules";
import { MonitoredItemSchema } from "../../utils/validators";
import { itemFilterRules } from "../../config/itemFilterRules";
import { z } from "zod";

// ---- helpers ---------------------------------------------------------------
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && !Number.isNaN(v);
const isString = (v: unknown): v is string =>
  typeof v === "string" && v.length >= 0;
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isArrayOfString = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isValidUrl = (u: unknown): u is string => {
  if (typeof u !== "string" || !u) return false;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
};
const toNumberOr = (v: unknown, fallback: number | null) => {
  if (isNumber(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
};
// ---------------------------------------------------------------------------

export async function backfillMonitoredFields(limit = 300) {
  const col = dbAdmin.collection("monitoredItems");
  const snap = await col.limit(limit).get();

  let updated = 0;

  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;

    // 同一 itemCode 前提で rakutenItems を参照（なければ undefined）
    const rakDoc = await dbAdmin.collection("rakutenItems").doc(doc.id).get();
    const rak = rakDoc.exists
      ? (rakDoc.data() as Record<string, unknown>)
      : undefined;

    // affiliateUrl は先に妥当化（不正なURLは空文字へ）
    const normalizedAffiliateUrl = isValidUrl(d.affiliateUrl)
      ? String(d.affiliateUrl)
      : "";

    // imageUrl フォールバック（monitored → 楽天）
    const normalizedImageUrl =
      (isString(d.imageUrl) && d.imageUrl) ||
      (isString(rak?.imageUrl) ? (rak!.imageUrl as string) : "") ||
      "";

    // レビュー：monitored に無ければ楽天からフォールバック（数値化）
    const normalizedReviewAverage =
      toNumberOr(d.reviewAverage, null) ?? toNumberOr(rak?.reviewAverage, null);

    const normalizedReviewCount =
      toNumberOr(d.reviewCount, null) ?? toNumberOr(rak?.reviewCount, null);

    // 1) 型に沿った安全な既定値（nullはnullのまま）
    const safe = {
      productName: isString(d.productName) ? d.productName : "",
      imageUrl: normalizedImageUrl,
      price: isNumber(d.price) ? d.price : 0,

      capacity: isNumber(d.capacity) ? d.capacity : null,
      outputPower: isNumber(d.outputPower) ? d.outputPower : null,
      weight: isNumber(d.weight) ? d.weight : null,
      hasTypeC: isBool(d.hasTypeC) ? d.hasTypeC : false,

      tags: isArrayOfString(d.tags) ? d.tags : [],
      category: isString(d.category) ? d.category : "",

      featureHighlights: isArrayOfString(d.featureHighlights)
        ? d.featureHighlights
        : [],
      aiSummary: isString(d.aiSummary) ? d.aiSummary : "",

      affiliateUrl: normalizedAffiliateUrl,

      // 追加フィールド（CVR用）
      inStock: d.inStock === null ? null : isBool(d.inStock) ? d.inStock : null,
      reviewAverage: normalizedReviewAverage,
      reviewCount:
        normalizedReviewCount !== null
          ? Math.trunc(normalizedReviewCount)
          : null,

      // そのまま維持
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,

      // Viewsの安全化
      views: isNumber(d.views) ? Math.max(0, Math.trunc(d.views)) : 0,

      // priceHistory は別関数で統一（ここでは触らない）
      priceHistory: Array.isArray(d.priceHistory)
        ? (d.priceHistory as unknown[])
        : [],
    };

    // 2) ルール適用（applyFilterRules は "フラット" な ItemSpec を想定）
    const ruleInput = {
      capacity: safe.capacity ?? null,
      outputPower: safe.outputPower ?? null,
      weight: safe.weight ?? null,
      hasTypeC: safe.hasTypeC,
    };
    const { tags: ruleTags, matchedRules } = applyFilterRules(
      ruleInput,
      itemFilterRules,
    );

    // 既存タグとマージ（重複排除）
    const mergedTags = Array.from(new Set([...(safe.tags ?? []), ...ruleTags]));

    // category が空なら、最初にマッチしたルールの label を採用
    const category = safe.category || (matchedRules[0]?.label ?? "");

    // 3) inStock 暫定判定（有効URL かつ price>0）
    const inStock = safe.affiliateUrl && safe.price > 0 ? true : null;

    // 4) 最終バリデーション（壊れてたら隔離）
    try {
      const candidate = {
        ...safe,
        tags: mergedTags,
        category,
        inStock,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      MonitoredItemSchema.parse(candidate);
      await doc.ref.update(candidate);
      updated++;
    } catch (e) {
      // どのフィールドが原因か要約して隔離
      const issues = Array.isArray((e as any)?.issues) ? (e as any).issues : [];
      const fields = Array.from(
        new Set(
          issues
            .map((i: any) =>
              Array.isArray(i?.path) ? String(i.path[0]) : null,
            )
            .filter(Boolean),
        ),
      );

      await dbAdmin
        .collection("quarantine")
        .doc(doc.id)
        .set({
          data: d,
          reason: "schema_fail",
          fields,
          zodIssues: issues.map((i: any) => ({
            code: i?.code ?? null,
            message: i?.message ?? null,
            path: Array.isArray(i?.path) ? i.path : null,
          })),
          at: Timestamp.fromDate(new Date()),
        });

      logger.warn(`quarantine: ${doc.id}`);
    }
  }

  // 5) priceHistory の正規化（同一日重複除去・末尾同期）
  await fixPriceHistory(limit);

  logger.info(`backfillMonitoredFields done. updated=${updated}/${snap.size}`);
}
