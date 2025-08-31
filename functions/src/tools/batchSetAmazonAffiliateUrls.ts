/**
 * 全 monitoredItems に amazonAffiliateUrl を付与するツール
 * - 既に amazonAffiliateUrl があるものはスキップ
 * - productName / itemName から Amazon 検索リンクを生成
 * - 1バッチ最大 400 書き込み、ページングで最後まで処理
 *
 * 使い方:
 *   # ドライラン（書き込みなし）
 *   npx ts-node functions/src/tools/batchSetAmazonAffiliateUrls.ts --dry-run
 *
 *   # 実行（書き込みあり）
 *   npx ts-node functions/src/tools/batchSetAmazonAffiliateUrls.ts
 */

import { db, Timestamp } from "../lib/firebase"; // ←あなたのAdmin初期化に合わせてください
import * as process from "node:process";

const AFFILIATE_TAG = "tw20th0c-22";
const BATCH_LIMIT = 400; // Firestoreの上限(500)より安全側
const PAGE_SIZE = 500; // 読み取り件数（書き込みより少し多めでもOK）

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");

function buildAmazonSearchUrl(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}&tag=${AFFILIATE_TAG}`;
}

function pickProductName(data: FirebaseFirestore.DocumentData): string {
  // 優先度: productName > itemName > itemCode
  return (
    (typeof data.productName === "string" && data.productName) ||
    (typeof data.itemName === "string" && data.itemName) ||
    (typeof data.itemCode === "string" && data.itemCode) ||
    ""
  );
}

function alreadyHasAmazonUrl(data: FirebaseFirestore.DocumentData): boolean {
  const v = data.amazonAffiliateUrl;
  return typeof v === "string" && v.trim().length > 0;
}

function affiliateUrlLooksAmazon(
  data: FirebaseFirestore.DocumentData,
): string | null {
  const v = data.affiliateUrl;
  if (typeof v === "string" && /amazon\./i.test(v)) return v;
  return null;
}

async function main() {
  console.log(`[batchSetAmazonAffiliateUrls] start. dryRun=${DRY_RUN}`);

  let lastDocId: string | null = null;
  let totalSeen = 0;
  let totalUpdated = 0;

  while (true) {
    // __name__ でページング
    let q = db
      .collection("monitoredItems")
      .orderBy("__name__")
      .limit(PAGE_SIZE);

    if (lastDocId) q = q.startAfter(lastDocId);

    const snap = await q.get();
    if (snap.empty) break;

    let batch = db.batch();
    let batchOps = 0;

    for (const doc of snap.docs) {
      totalSeen++;
      const data = doc.data();

      // 既に amazonAffiliateUrl があればスキップ
      if (alreadyHasAmazonUrl(data)) continue;

      // 既存 affiliateUrl が Amazon ぽいなら、それを流用
      const existingAmazon = affiliateUrlLooksAmazon(data);
      let url: string | null = existingAmazon;

      // なければ productName から検索URLを生成
      if (!url) {
        const name = pickProductName(data);
        if (!name) continue; // 生成できないのでスキップ
        url = buildAmazonSearchUrl(name);
      }

      if (!DRY_RUN) {
        batch.update(doc.ref, {
          amazonAffiliateUrl: url,
          updatedAt: Timestamp.now(),
        });
      }

      batchOps++;
      totalUpdated++;

      if (batchOps >= BATCH_LIMIT) {
        if (!DRY_RUN) await batch.commit();
        console.log(
          ` committed ${batchOps} updates (totalUpdated=${totalUpdated})`,
        );
        batch = db.batch();
        batchOps = 0;
      }
    }

    // 残りをコミット
    if (batchOps > 0) {
      if (!DRY_RUN) await batch.commit();
      console.log(
        ` committed ${batchOps} updates (totalUpdated=${totalUpdated})`,
      );
    }

    // 次ページ用カーソル
    lastDocId = snap.docs[snap.docs.length - 1].id;
    console.log(
      ` page processed. lastDocId=${lastDocId} totalSeen=${totalSeen}`,
    );
  }

  console.log(
    `[batchSetAmazonAffiliateUrls] done. seen=${totalSeen} updated=${totalUpdated} dryRun=${DRY_RUN}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
