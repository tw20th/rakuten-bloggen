// functions/src/tools/setAmazonAffiliateUrl.ts
import { db, Timestamp } from "../lib/firebase"; // プロジェクトの実パスに合わせて

// 変更したい対象
const TARGET_ITEM_CODE = "087481ai:10091695";

// まずは検索リンク（ASIN未確定の暫定。審査要件は満たせます）
const AMAZON_URL =
  "https://www.amazon.co.jp/s?k=Anker+621+Power+Bank&tag=tw20th0c-22";

async function main(): Promise<void> {
  const snap = await db
    .collection("monitoredItems")
    .where("itemCode", "==", TARGET_ITEM_CODE)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error(`monitoredItems not found: itemCode=${TARGET_ITEM_CODE}`);
  }

  const doc = snap.docs[0].ref;
  await doc.update({
    amazonAffiliateUrl: AMAZON_URL,
    updatedAt: Timestamp.now(),
  });

  // ログ
  // eslint-disable-next-line no-console
  console.log(
    `Updated ${doc.path} amazonAffiliateUrl -> ${AMAZON_URL} (and updatedAt)`,
  );
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("done");
    process.exit(0);
  })
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
