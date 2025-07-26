import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";
import { db } from "../lib/firebase";
import { RAKUTEN_APPLICATION_ID } from "../config/secrets";

export const fetchRakutenItemsHandler = async (req: Request, res: Response) => {
  const applicationId = RAKUTEN_APPLICATION_ID.value();

  if (!applicationId) {
    logger.error("❌ 楽天APIキーが設定されていません");
    res.status(500).send("Missing Rakuten API Key");
    return;
  }

  try {
    const keyword = req.query.keyword?.toString() || "モバイルバッテリー";
    const apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?format=json&keyword=${encodeURIComponent(
      keyword,
    )}&applicationId=${applicationId}&hits=10`;

    logger.info("🔍 楽天API URL:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      logger.error("❌ 楽天APIレスポンスエラー", {
        status: response.status,
        statusText: response.statusText,
      });
      res.status(500).send("Rakuten API error");
      return;
    }

    const data = await response.json();

    logger.debug("📦 楽天APIレスポンス:", JSON.stringify(data, null, 2));

    if (!data.Items || data.Items.length === 0) {
      logger.warn("⚠️ 楽天APIでアイテムが見つかりませんでした");
      res.status(404).send("No items found.");
      return;
    }

    const item = data.Items[0].Item;

    const docData = {
      itemCode: item.itemCode ?? "",
      itemName: item.itemName ?? "",
      itemPrice: item.itemPrice ?? 0,
      affiliateUrl: item.affiliateUrl ?? "",
      imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? "",
      description: item.itemCaption ?? "",
      createdAt: new Date(),
    };

    logger.debug("📝 保存するドキュメントデータ:", docData);

    await db.collection("rakutenItems").doc(item.itemCode).set(docData);

    logger.info("✅ Firestore保存完了", {
      itemCode: item.itemCode,
      itemName: item.itemName,
    });

    res.status(200).send("Saved item: " + item.itemName);
  } catch (error) {
    logger.error("❌ 処理中エラー", error as Error);
    res.status(500).send("Error fetching from Rakuten API");
  }
};
