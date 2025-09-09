import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import { revalidate } from "../seo/triggerRevalidate";

const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakuten-bloggen.vercel.app";
const START = "<!-- related:auto:start -->";
const END = "<!-- related:auto:end -->";

/** 関連記事を最大 max 件、同カテゴリ>タグ一致>新着 の優先で返す */
async function pickRelated(
  slug: string,
  category?: string,
  tags?: string[],
  max = 5,
) {
  const col = db.collection("blogs");
  const results: Array<{
    slug: string;
    title: string;
    category?: string;
    tags?: string[];
    updatedAt?: Date;
    score: number;
  }> = [];

  const snap = await col
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();
  for (const d of snap.docs) {
    const b = d.data() as any;
    if (b.slug === slug) continue;
    const tgs: string[] = Array.isArray(b.tags) ? b.tags : [];
    const sameCat = category && b.category === category ? 1 : 0;
    const tagOverlap =
      tags && tags.length ? tgs.filter((t) => tags.includes(t)).length : 0;
    const freshness = b.updatedAt ? 0.01 : 0; // 微小係数（順位同点回避）
    const score = sameCat * 10 + tagOverlap * 2 + freshness;
    results.push({
      slug: b.slug,
      title: b.title,
      category: b.category,
      tags: tgs,
      updatedAt: b.updatedAt?.toDate?.(),
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, max);
}

/** コンテンツ末尾に関連記事ブロックを idempotent に差し込む */
function injectRelated(
  content: string,
  items: { slug: string; title: string }[],
) {
  const block = [
    START,
    "",
    "## 関連記事",
    ...items.map((i) => `- [${i.title}](/blog/${i.slug})`),
    "",
    END,
  ].join("\n");

  if (!content) return block; // まれに空のとき

  const hasStart = content.includes(START);
  const hasEnd = content.includes(END);

  if (hasStart && hasEnd) {
    // 既存ブロックを丸ごと置換
    const regex = new RegExp(`${START}[\\s\\S]*?${END}`);
    return content.replace(regex, block);
  }
  // 無ければ末尾へ追加（前に空行を入れて可読性確保）
  return `${content.trim()}\n\n${block}\n`;
}

/** 公開済みブログ N件を対象に関連記事ブロックを差し替え */
export async function relatedContentWriter(limit = 30) {
  const col = db.collection("blogs");
  const snap = await col
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  if (snap.empty) {
    logger.info("relatedContentWriter: no published blogs");
    return 0;
  }

  let updated = 0;
  for (const doc of snap.docs) {
    const b = doc.data() as any;
    const related = await pickRelated(
      b.slug,
      b.category,
      Array.isArray(b.tags) ? b.tags : [],
      5,
    );
    if (related.length === 0) continue;

    const next = injectRelated(
      b.content || "",
      related.map((r) => ({ slug: r.slug, title: r.title })),
    );
    if (next !== (b.content || "")) {
      await doc.ref.update({ content: next, updatedAt: new Date() });
      await revalidate(`/blog/${b.slug}`);
      updated++;
    }
  }
  logger.info("relatedContentWriter finished", { updated });
  return updated;
}
