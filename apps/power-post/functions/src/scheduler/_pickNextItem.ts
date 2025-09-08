import { db } from "../lib/firebase";
import { logger } from "firebase-functions";
import { getGenState } from "../lib/state";

/**
 * 生成対象の itemCode を決める:
 * - catalogItems を新しい順に 50件 pull
 * - 楽天URLの無いものを除外
 * - blogs に既出の relatedItemCode があるものを除外
 * - 直近に使った lastItemCode は避ける
 */
export async function pickNextItemCode(): Promise<string | null> {
  const state = await getGenState();

  const q = await db
    .collection("catalogItems")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  const candidates = q.docs
    .map((d) => ({ id: d.id, aff: d.get("affiliate") }))
    .filter((x) => !!x.aff?.rakutenUrl) // 楽天URLありだけ
    .map((x) => x.id);

  if (candidates.length === 0) {
    logger.warn("候補0件（楽天URL付きが見つからない）");
    return null;
  }

  // 直近の item を優先的に避ける
  const filtered = candidates.filter((id) => id !== state.lastItemCode);

  // 既出チェック（順に照会）
  for (const id of filtered) {
    const dup = await db
      .collection("blogs")
      .where("relatedItemCode", "==", id)
      .limit(1)
      .get();
    if (dup.empty) return id;
  }

  // 全て既出 or 直近と被り → 直近も含めて再走査
  for (const id of candidates) {
    const dup = await db
      .collection("blogs")
      .where("relatedItemCode", "==", id)
      .limit(1)
      .get();
    if (dup.empty) return id;
  }

  logger.info("未掲載アイテムが見つからず。スキップ");
  return null;
}
