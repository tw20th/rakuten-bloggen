// functions/src/utils/generateBlogLogic.ts
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";
import { db } from "../lib/firebase";
import { basicSlug, safeTailFromItemCode, shortId } from "../utils/slugify";
import { OPENAI_API_KEY } from "../config/secrets";

const getOpenAIClient = () => {
  const apiKey = OPENAI_API_KEY.value();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
};

async function ensureUniqueSlug(
  base: string,
  itemCode: string,
): Promise<string> {
  let slug = base.slice(0, 60).replace(/-+$/g, ""); // 後端の-を再度ケア
  // 空なら itemCode 由来で最低限の slug を作る
  if (!slug) slug = safeTailFromItemCode(itemCode).slice(0, 60);

  // 既存チェックして被ってたら短IDを足す（決定論的：itemCodeベース）
  const col = db.collection("blogs");
  let final = slug;
  let tries = 0;
  // 2,3回で十分（衝突は稀）
  while ((await col.doc(final).get()).exists && tries < 3) {
    const suffix = shortId(`${itemCode}:${tries}`);
    final = `${slug}-${suffix}`.slice(0, 60).replace(/-+$/g, "");
    tries++;
  }
  return final;
}

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
  const tags = (monitoredData?.tags as string[] | undefined) ?? [];
  const category = (monitoredData?.category as string | undefined) ?? "";

  // --- コンテンツ生成（必要なら後でテンプレ強化） ---
  const prompt = `次の商品の紹介記事を書いてください：${item?.itemName}\n説明：${item?.description}`;
  const chatRes = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  const content = chatRes.choices[0].message.content || "";

  // --- スラッグ生成を堅牢化 ---
  const primary = basicSlug((item?.itemName as string) || "");
  let slugCandidate = primary;

  // 最低長8に満たない／弱い場合は itemCode 尾部を併合
  if (slugCandidate.length < 8) {
    const tail = safeTailFromItemCode(itemCode);
    slugCandidate = primary ? `${primary}-${tail}` : tail;
  }
  // 最終60文字で切る（途中で短縮するが ensureUnique 内でも再ケア）
  slugCandidate = slugCandidate.slice(0, 60).replace(/-+$/g, "");

  // 既存との重複を回避
  const slug = await ensureUniqueSlug(slugCandidate, itemCode);

  await db
    .collection("blogs")
    .doc(slug)
    .set({
      slug,
      title: item?.itemName ?? "",
      content,
      status: "draft",
      relatedItemCode: itemCode, // ← blogs には itemCode をここで紐づけ（既にOK）
      tags,
      category,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl:
        (monitoredData?.imageUrl as string | undefined) ||
        (item?.imageUrl as string | undefined) ||
        "",
    });

  logger.info("✅ ブログ記事の保存が完了", { slug });
  return slug;
};
