import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { db } from "../lib/firebase";
import { slugify } from "../utils/slugify";
import { OPENAI_API_KEY } from "../config/secrets";

const getOpenAIClient = () => {
  const apiKey = OPENAI_API_KEY.value();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
};

export const generateBlogFromItem = async (
  itemCode: string,
): Promise<string> => {
  logger.info("📝 generateBlogFromItem 実行", { itemCode });

  const openai = getOpenAIClient();

  const itemSnap = await db.collection("rakutenItems").doc(itemCode).get();
  if (!itemSnap.exists) {
    throw new Error(`Item not found: ${itemCode}`);
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

  return slug;
};
