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

  // ✅ monitoredItems から tags と category を取得（存在しなければ空に）
  const monitoredId = itemCode.replace(/:/g, "-");
  const monitoredSnap = await db
    .collection("monitoredItems")
    .doc(monitoredId)
    .get();
  const monitoredData = monitoredSnap.exists ? monitoredSnap.data() : {};
  const tags = monitoredData?.tags ?? [];
  const category = monitoredData?.category ?? "";

  const prompt = `次の商品の紹介記事を書いてください：${item?.itemName}\n説明：${item?.description}`;

  const chatRes = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const content = chatRes.choices[0].message.content || "";
  const slug = slugify(item?.itemName || itemCode);

  await db
    .collection("blogs")
    .doc(slug)
    .set({
      slug,
      title: item?.itemName,
      content,
      status: "draft",
      relatedItemCode: itemCode,
      tags,
      category,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: monitoredData?.imageUrl || item?.imageUrl || "",
    });

  logger.info("✅ ブログ記事の保存が完了", { slug });

  return slug;
};
