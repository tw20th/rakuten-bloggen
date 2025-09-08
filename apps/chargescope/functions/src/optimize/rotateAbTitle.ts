import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import { revalidate } from "../seo/triggerRevalidate";

/** AB候補をローテーションして title を差し替え（公開済みの最新N件） */
export async function rotateAbTitle(maxDocs = 50) {
  const snap = await db
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(maxDocs)
    .get();

  if (snap.empty) return 0;

  let rotated = 0;
  for (const d of snap.docs) {
    const b = d.data() as any;
    const ab = b.ab || {};
    const candidates: string[] = Array.isArray(ab.titleCandidates)
      ? ab.titleCandidates
      : [];
    if (candidates.length < 2) continue;

    // 今の index を次へ
    const idx = Number.isFinite(ab.currentIndex) ? Number(ab.currentIndex) : 0;
    const nextIdx = (idx + 1) % candidates.length;
    const nextTitle = candidates[nextIdx];

    // 同一ならスキップ
    if (typeof nextTitle !== "string" || !nextTitle || nextTitle === b.title)
      continue;

    await d.ref.update({
      title: nextTitle,
      ab: {
        ...ab,
        currentIndex: nextIdx,
        lastRotatedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    });

    await revalidate(`/blog/${b.slug}`);
    rotated++;
  }

  logger.info("rotateAbTitle finished", { rotated });
  return rotated;
}
