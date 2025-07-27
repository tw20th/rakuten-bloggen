import { onRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { generateBlogFromItem } from "../utils/generateBlogLogic";

// 🧠 メインハンドラー
export const generateBlogFromItemHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    logger.info("📝 ブログ記事の生成処理を開始");

    const itemCode = req.body?.itemCode || req.query.itemCode;
    if (!itemCode) {
      res.status(400).json({ error: "itemCode is required" });
      return;
    }

    const slug = await generateBlogFromItem(itemCode);

    res.status(200).json({ message: "Blog created", slug });
  } catch (error) {
    logger.error("❌ ブログ生成中にエラーが発生", error as Error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Cloud Functions として公開
export const generateBlogFromItemFunc = onRequest(
  { cors: true },
  generateBlogFromItemHandler,
);
