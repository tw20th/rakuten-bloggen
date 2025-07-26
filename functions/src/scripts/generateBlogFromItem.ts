// functions/src/scripts/generateBlogFromItem.ts
import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import OpenAI from "openai";
import { slugify } from "../utils/slugify";
import { OPENAI_API_KEY } from "../config/secrets"; // ✅ Secret import

const getOpenAIClient = () => {
  const apiKey = OPENAI_API_KEY.value(); // ✅ .value() で取得
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
};

export const generateBlogFromItemHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    logger.info("📝 ブログ記事の生成処理を開始");

    const openai = getOpenAIClient();

    const { itemCode } = req.body;
    if (!itemCode) {
      res.status(400).json({ error: "itemCode is required" });
      return;
    }

    const itemSnap = await db.collection("rakutenItems").doc(itemCode).get();
    if (!itemSnap.exists) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const item = itemSnap.data();
    const prompt = `次の商品の紹介記事を書いてください：${item?.itemName}\n説明：${item?.description}`;

    const chatRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const content = chatRes.choices[0].message.content || "";
    const slug = slugify(item?.itemName || itemCode);

    await db.collection("blogs").doc(slug).set({
      slug,
      title: item?.itemName,
      content,
      status: "draft",
      relatedItemCode: itemCode,
      createdAt: new Date(),
    });

    logger.info("✅ ブログ記事の保存が完了", { slug });
    res.status(200).json({ message: "Blog created", slug });
  } catch (error) {
    logger.error("❌ ブログ生成中にエラーが発生", error as Error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
