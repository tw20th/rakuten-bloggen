import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { generateBlogFromItem as generateBlogLogic } from "../utils/generateBlogLogic";
import { revalidateMany } from "../utils/revalidate"; // ★ 追加

// 🎯 HTTPハンドラー関数（v1用）
export const generateBlogFromItemHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    logger.info("📝 ブログ記事の生成処理を開始");

    const itemCode = (req.body?.itemCode ?? req.query.itemCode) as unknown;

    if (typeof itemCode !== "string" || itemCode.length === 0) {
      res.status(400).json({ error: "itemCode is required" });
      return;
    }

    const slug = await generateBlogLogic(itemCode);

    // ★ 生成直後に ISR をキック
    try {
      await revalidateMany(["/blog", `/blog/${slug}`]);
      logger.info("🔁 ISR revalidate queued", {
        paths: ["/blog", `/blog/${slug}`],
      });
    } catch (e) {
      // ISR 失敗はレスポンスは成功のまま（運用継続重視）
      logger.warn("⚠️ ISR revalidate failed", {
        error: (e as Error).message,
        slug,
      });
    }

    res.status(200).json({ message: "Blog created", slug });
  } catch (error) {
    logger.error("❌ ブログ生成中にエラーが発生", error as Error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
