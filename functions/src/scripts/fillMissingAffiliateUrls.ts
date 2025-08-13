// functions/src/scripts/fillMissingAffiliateUrls.ts
import { db } from "../lib/firebase";
import { RAKUTEN_AFFILIATE_ID } from "../config/secrets";
import * as logger from "firebase-functions/logger";

export const fillMissingAffiliateUrls = async () => {
  const affiliateId = RAKUTEN_AFFILIATE_ID.value();
  if (!affiliateId) {
    throw new Error("❌ 楽天アフィリエイトIDが未設定です");
  }

  const snapshot = await db.collection("rakutenItems").get();
  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // すでにaffiliateUrlが設定済ならスキップ
    if (data.affiliateUrl && data.affiliateUrl !== "") {
      skippedCount++;
      continue;
    }

    const itemUrl = data.itemUrl;
    if (!itemUrl) {
      logger.warn("⚠️ itemUrlが存在しないためスキップ", {
        itemCode: data.itemCode,
      });
      continue;
    }

    const newAffiliateUrl = `${itemUrl}?scid=af_pc_etc&affiliateId=${affiliateId}`;

    await doc.ref.update({
      affiliateUrl: newAffiliateUrl,
      updatedAt: new Date(),
    });

    updatedCount++;
    logger.info("✅ affiliateUrl を補完", {
      itemCode: data.itemCode,
      affiliateUrl: newAffiliateUrl,
    });
  }

  logger.info(
    `🎉 処理完了：補完 ${updatedCount} 件, スキップ ${skippedCount} 件`,
  );
};
