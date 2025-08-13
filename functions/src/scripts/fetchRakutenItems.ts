// functions/src/scripts/fetchRakutenItems.ts

import * as functions from "firebase-functions";
import { Request, Response } from "express";
import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic";

// 🔧 メインのハンドラー関数
const fetchRakutenItemsHandler = async (req: Request, res: Response) => {
  try {
    const itemName = await getRakutenItemsAndSave();
    res.status(200).send("Saved item: " + itemName);
  } catch (error) {
    functions.logger.error("❌ 処理中エラー", error as Error);
    res.status(500).send("Error fetching from Rakuten API");
  }
};

// ✅ 明示的に export（←これが不足していた）
export { fetchRakutenItemsHandler };

// ✅ v1: region指定ありの HTTP 関数としてエクスポート
export const fetchRakutenItems = functions
  .region("asia-northeast1")
  .https.onRequest(fetchRakutenItemsHandler);
