import { db } from "../lib/firebase";
import { generateBlogFromItem } from "../utils/generateBlogLogic";
import { logger } from "firebase-functions";
import { revalidateMany } from "../seo/triggerRevalidate";
import { isGenerationEnabled } from "../lib/flags";
import { pickNextItemCode } from "./_pickNextItem";
import { setGenState } from "../lib/state";

export const runScheduledBlogMorning = async (): Promise<void> => {
  logger.info("⏰ scheduledBlogMorning 開始");

  if (!(await isGenerationEnabled())) {
    logger.warn("generationEnabled=false のためスキップ");
    return;
  }

  const itemCode = await pickNextItemCode();
  if (!itemCode) return;

  // 二重安全装置（極稀にレースした場合）
  const dup = await db
    .collection("blogs")
    .where("relatedItemCode", "==", itemCode)
    .limit(1)
    .get();
  if (!dup.empty) {
    logger.info("直前に他プロセスで生成済み。スキップ", { itemCode });
    return;
  }

  try {
    const slug = await generateBlogFromItem(itemCode);
    await setGenState({ lastItemCode: itemCode });
    logger.info("✅ ブログ生成完了", { slug, itemCode });
    await revalidateMany(["/blog", `/blog/${slug}`]);
  } catch (err) {
    logger.error("🚨 ブログ生成エラー", err as Error);
  }
};
