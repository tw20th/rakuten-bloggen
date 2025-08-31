// functions/src/scripts/item/filterAndSaveItems.ts
import {
  extractCapacity,
  extractOutputPower,
  extractWeight,
  checkTypeC,
  extractShortTitle,
} from "../../utils/extractSpecs";
import { itemFilterRules } from "../../config/itemFilterRules";
import { applyFilterRules } from "../../utils/applyFilterRules";
import { generateFeatureHighlights } from "../../utils/generateFeatureHighlights";
import { db, Timestamp } from "../../lib/firebase";

// ---- types ----------------------------------------------------
type RawRakuten = {
  itemCode: string;
  itemName?: string;
  itemPrice?: number;
  description?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  reviewAverage?: number | null;
  reviewCount?: number | null;
  createdAt?: FirebaseFirestore.Timestamp | Date | string;
};

type PriceHistoryEntry = { date: string; price: number }; // ← ISO string に統一

const toISO = (d: unknown): string => {
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  // Firestore Timestamp
  // @ts-expect-error - timestamp型の場合のみtoDateが存在
  if (d && typeof d === "object" && typeof d.toDate === "function") {
    // @ts-ignore
    return d.toDate().toISOString();
  }
  return new Date().toISOString();
};

const CHUNK = 10; // 同時実行の上限
const HIST_MAX = 180; // 履歴の最大保持件数（約半年想定）

// ---------------------------------------------------------------
export const filterAndSaveItems = async () => {
  const snapshot = await db.collection("rakutenItems").get();
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);

    await Promise.all(
      slice.map(async (doc) => {
        const src = doc.data() as RawRakuten;
        const description = src.description ?? "";

        // --- spec 抽出 ---
        const capacity = extractCapacity(description);
        const outputPower = extractOutputPower(description);
        const weight = extractWeight(description);
        const hasTypeC = checkTypeC(description);

        // --- 特徴抽出 ---
        const featureHighlights = generateFeatureHighlights({
          capacity,
          outputPower,
          weight,
          hasTypeC,
        });

        // --- ルール適用（カテゴリ/タグ） ---
        const {
          tags,
          matchedRules,
          category: ruleCategory,
        } = applyFilterRules(
          {
            capacity,
            outputPower,
            weight,
            hasTypeC,
            itemName: src.itemName ?? "",
          },
          itemFilterRules,
        );
        const category = ruleCategory ?? matchedRules[0]?.label ?? "";

        // --- 保存先 doc（IDは:→-でサニタイズ） ---
        const id = doc.id.replace(/:/g, "-");
        const ref = db.collection("monitoredItems").doc(id);

        const nowTs = Timestamp.now();
        const nowISO = new Date().toISOString();

        // 既存ドキュメント取得
        const prevSnap = await ref.get();
        const prev = prevSnap.exists ? (prevSnap.data() as any) : null;

        // --- 価格決定 ---
        const price: number =
          typeof src.itemPrice === "number"
            ? src.itemPrice
            : typeof prev?.price === "number"
              ? prev.price
              : 0;

        // --- 履歴（ISO文字列で統一） ---
        const prevHist: PriceHistoryEntry[] = Array.isArray(prev?.priceHistory)
          ? prev.priceHistory.map((h: any) => ({
              date: typeof h?.date === "string" ? h.date : toISO(h?.date),
              price: Number(h?.price ?? 0),
            }))
          : [];

        const last = prevHist.length
          ? prevHist[prevHist.length - 1]
          : undefined;
        const priceChanged =
          typeof last?.price === "number" ? last.price !== price : true;

        const priceHistory: PriceHistoryEntry[] = priceChanged
          ? [...prevHist, { date: nowISO, price }].slice(-HIST_MAX)
          : prevHist;

        // --- AI要約（ここでは生成しない：既存を尊重） ---
        const aiSummary: string = prev?.aiSummary ?? "";

        // --- レビュー/画像/名前は常に最新で上書き（欠損は既存維持） ---
        const reviewAverage =
          src.reviewAverage != null
            ? Number(src.reviewAverage)
            : (prev?.reviewAverage ?? null);
        const reviewCount =
          src.reviewCount != null
            ? Number(src.reviewCount)
            : (prev?.reviewCount ?? null);
        const imageUrl = src.imageUrl ?? prev?.imageUrl ?? "";
        const productName = extractShortTitle(
          src.itemName ?? prev?.productName ?? "",
        );

        // --- まとめて upsert ---
        const payload = {
          // 元の itemCode は必ず保持
          itemCode: doc.id as string,
          productName,
          imageUrl,
          price,
          capacity,
          outputPower,
          weight,
          hasTypeC,
          tags,
          category,
          featureHighlights,
          aiSummary, // 生成は別ジョブ
          affiliateUrl: src.affiliateUrl ?? prev?.affiliateUrl ?? "",
          reviewAverage,
          reviewCount,
          views: prev?.views ?? 0,
          createdAt:
            prev?.createdAt ??
            (src.createdAt
              ? Timestamp.fromDate(new Date(toISO(src.createdAt)))
              : nowTs),
          updatedAt: nowTs,
          priceHistory,
        };

        await ref.set(payload, { merge: true });
      }),
    );
  }
};
