import { db as dbAdmin, Timestamp } from "../../lib/firebase";
import { logger } from "firebase-functions";
import { itemFilterRules } from "../../config/itemFilterRules";
import { applyFilterRules } from "../../utils/applyFilterRules";
import type { QualityIssue, DataQualityStamp } from "../../types/quality";
import type {
  MonitoredItem,
  PriceHistoryEntry,
} from "../../types/monitoredItem";

const RUN_ID = () => {
  const d = new Date();
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const isUrl = (v: unknown): v is string =>
  isNonEmptyString(v) && /^https?:\/\//i.test(v);
const isValidPriceHistory = (arr: unknown): arr is PriceHistoryEntry[] =>
  Array.isArray(arr) &&
  arr.every((p) => typeof p?.price === "number" && isNonEmptyString(p?.date));

export async function runDataQualitySweep() {
  const runId = RUN_ID();
  const issues: QualityIssue[] = [];
  let fixedCount = 0;

  // --------- monitoredItems ------------------------------------------------
  {
    const snap = await dbAdmin.collection("monitoredItems").get();
    for (const doc of snap.docs) {
      const before = doc.data() as Partial<MonitoredItem> & {
        itemCode?: string;
        dataQuality?: DataQualityStamp;
      };
      const updates: Partial<MonitoredItem> & {
        dataQuality?: DataQualityStamp;
      } = {};
      const flags: string[] = [];
      const autoFixed: string[] = [];

      // aiSummary
      if (!isNonEmptyString(before.aiSummary)) {
        const base = [before.productName, ...(before.featureHighlights ?? [])]
          .filter(isNonEmptyString)
          .join(" / ");
        if (isNonEmptyString(base)) {
          updates.aiSummary = `特徴: ${base}`;
          autoFixed.push("aiSummary");
        } else {
          flags.push("missing.aiSummary");
          issues.push({
            collection: "monitoredItems",
            docId: doc.id,
            field: "aiSummary",
            type: "missing",
          });
        }
      }

      // priceHistory
      if (!isValidPriceHistory(before.priceHistory)) {
        if (Array.isArray(before.priceHistory)) {
          const arr = (before.priceHistory ?? []) as unknown[];
          const cleaned: PriceHistoryEntry[] = arr
            .filter(
              (p: any) =>
                typeof p?.price === "number" && isNonEmptyString(p?.date),
            )
            .map((p: any) => ({
              price: Number(p.price),
              date: String(p.date),
            }));
          if (cleaned.length > 0) {
            updates.priceHistory = cleaned;
            autoFixed.push("priceHistory");
          } else {
            flags.push("invalid.priceHistory");
            issues.push({
              collection: "monitoredItems",
              docId: doc.id,
              field: "priceHistory",
              type: "invalid",
              note: "no valid entries",
            });
          }
        } else {
          flags.push("missing.priceHistory");
          issues.push({
            collection: "monitoredItems",
            docId: doc.id,
            field: "priceHistory",
            type: "missing",
          });
        }
      }

      // affiliateUrl 補完（rakutenItems逆参照）
      if (!isUrl(before.affiliateUrl)) {
        const itemCode = (before as any).itemCode as string | undefined; // monitored に itemCode があるなら使う
        let affiliate: string | null = null;

        if (itemCode) {
          const r = await dbAdmin
            .collection("rakutenItems")
            .doc(itemCode)
            .get();
          if (r.exists) {
            const data = r.data() as { affiliateUrl?: string | null };
            if (isUrl(data?.affiliateUrl)) affiliate = data!.affiliateUrl!;
          }
        } else if (isNonEmptyString(before.productName)) {
          // itemCode が無いときは productName で fuzzy 取得（最初の1件）
          const q = await dbAdmin
            .collection("rakutenItems")
            .where("itemName", "==", before.productName)
            .limit(1)
            .get();
          if (!q.empty) {
            const data = q.docs[0].data() as { affiliateUrl?: string | null };
            if (isUrl(data?.affiliateUrl)) affiliate = data!.affiliateUrl!;
          }
        }

        if (affiliate) {
          updates.affiliateUrl = affiliate;
          autoFixed.push("affiliateUrl");
        } else {
          flags.push("missing.affiliateUrl");
          issues.push({
            collection: "monitoredItems",
            docId: doc.id,
            field: "affiliateUrl",
            type: "notFound",
          });
        }
      }

      // category / tags の自動付与（ルール再適用）
      const needRule =
        !isNonEmptyString(before.category) ||
        !Array.isArray(before.tags) ||
        before.tags.length === 0;
      if (needRule) {
        const ruleResult = applyFilterRules(
          {
            productName: before.productName ?? "",
            description: "",
            capacity: before.capacity ?? null,
            outputPower: before.outputPower ?? null,
            weight: before.weight ?? null,
            hasTypeC: Boolean(before.hasTypeC),
            featureHighlightsText: Array.isArray(before.featureHighlights)
              ? before.featureHighlights.join(" ")
              : "",
          },
          itemFilterRules,
        );
        const categoryCandidate =
          (ruleResult as ReturnType<typeof applyFilterRules>).matchedRules?.[0]
            ?.label ?? "";

        if (
          !isNonEmptyString(before.category) &&
          isNonEmptyString(categoryCandidate)
        ) {
          updates.category = categoryCandidate;
          autoFixed.push("category");
        }
        if (
          (!Array.isArray(before.tags) || before.tags.length === 0) &&
          ruleResult.tags.length > 0
        ) {
          updates.tags = ruleResult.tags;
          autoFixed.push("tags");
        }
      }

      // dataQuality スタンプ
      const scoreBase = 100;
      const penalties = [
        ...flags.map(() => 10),
        ...(!isNonEmptyString(before.imageUrl) || !isUrl(before.imageUrl)
          ? [10]
          : []),
        ...(typeof before.price !== "number" ? [20] : []),
      ];
      const score = Math.max(
        0,
        scoreBase - penalties.reduce((a, b) => a + b, 0),
      );

      updates.dataQuality = {
        score,
        flags,
        autoFixed,
        lastCheckedAt: Timestamp.now(),
      };

      // まとめて反映
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        if (autoFixed.length > 0) fixedCount++;
      }
    }
  }

  // --------- blogs ---------------------------------------------------------
  {
    const snap = await dbAdmin.collection("blogs").get();
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const updates: Record<string, unknown> = {};
      const flags: string[] = [];
      const autoFixed: string[] = [];

      // status
      if (d.status !== "draft" && d.status !== "published") {
        updates.status = "draft";
        autoFixed.push("status");
      }

      // title / slug / content の最低限チェック
      const titleOk = isNonEmptyString(d.title);
      const slugOk = isNonEmptyString(d.slug);
      const contentOk = isNonEmptyString(d.content);

      if (!titleOk) {
        flags.push("missing.title");
      }
      if (!slugOk) {
        flags.push("missing.slug");
      }
      if (!contentOk) {
        flags.push("missing.content");
      }

      // dataQuality
      const score = 100 - flags.length * 10;
      updates["dataQuality"] = {
        score: Math.max(0, score),
        flags,
        autoFixed,
        lastCheckedAt: Timestamp.now(),
      };

      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
      }
    }
  }

  // --------- 監査スナップショット保存 --------------------------------------
  const auditsCol = dbAdmin.collection("audits").doc(runId);
  await auditsCol.set({
    createdAt: Timestamp.now(),
    summary: {
      fixedCount,
    },
  });

  const batch = dbAdmin.batch();
  for (const i of issues) {
    batch.set(auditsCol.collection("issues").doc(), i);
  }
  await batch.commit();

  logger.info(
    `DataQuality sweep done. runId=${runId}, fixed=${fixedCount}, issues=${issues.length}`,
  );
  return { runId, fixed: fixedCount, issues: issues.length };
}
