import { onRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic"; // ← 分離ロジックを呼び出し

// 🔧 メインのハンドラー関数
export const fetchRakutenItemsHandler = async (req: Request, res: Response) => {
  try {
    const itemName = await getRakutenItemsAndSave(); // 🔁 共通ロジックを実行
    res.status(200).send("Saved item: " + itemName);
  } catch (error) {
    logger.error("❌ 処理中エラー", error as Error);
    res.status(500).send("Error fetching from Rakuten API");
  }
};

// ✅ Cloud Functions v2 のエクスポート
export const fetchRakutenItemsFunc = onRequest(
  { cors: true },
  fetchRakutenItemsHandler,
);
