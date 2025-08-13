import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import {
  RAKUTEN_APPLICATION_ID,
  RAKUTEN_AFFILIATE_ID,
} from "../config/secrets";

export const getRakutenItemsAndSave = async () => {
  const applicationId = RAKUTEN_APPLICATION_ID.value();
  const affiliateId = RAKUTEN_AFFILIATE_ID.value(); // ✅ 追加

  if (!applicationId || !affiliateId) {
    throw new Error("❌ 楽天APIキーまたはアフィリエイトIDが未設定です");
  }

  const keyword = "モバイルバッテリー";
  const apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?format=json&keyword=${encodeURIComponent(
    keyword,
  )}&applicationId=${applicationId}&affiliateId=${affiliateId}&hits=10&sort=-updateTimestamp`;

  logger.info("🔍 楽天API URL:", apiUrl);

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(
      `楽天APIレスポンスエラー: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  logger.debug("📦 楽天APIレスポンス:", JSON.stringify(data, null, 2));

  if (!data.Items || data.Items.length === 0) {
    throw new Error("⚠️ 楽天APIでアイテムが見つかりませんでした");
  }

  let savedCount = 0;

  for (const wrapper of data.Items) {
    const item = wrapper.Item;
    const itemCode = item.itemCode ?? "";
    const docRef = db.collection("rakutenItems").doc(itemCode);
    const existing = await docRef.get();

    if (existing.exists) {
      logger.info("↪️ 既存商品のためスキップ", { itemCode });
      continue;
    }

    const docData = {
      itemCode,
      itemName: item.itemName ?? "",
      itemPrice: item.itemPrice ?? 0,
      affiliateUrl: item.affiliateUrl ?? "",
      imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? "",
      description: item.itemCaption ?? "",
      createdAt: new Date(),
    };

    await docRef.set(docData);
    savedCount++;
    logger.info("🆕 新規商品を保存", { itemCode, itemName: item.itemName });
  }

  logger.info(`✅ 保存完了：新規 ${savedCount} 件`);
};
