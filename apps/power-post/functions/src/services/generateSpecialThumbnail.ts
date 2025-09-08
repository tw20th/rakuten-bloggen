/* functions/src/services/generateSpecialThumbnail.ts */
import { db } from "../lib/firebase";
import { composeProductThumbnail } from "./thumbnail";

// --- 型（Firebase の Timestamp は FQCN で参照） -------------------------
export type RakutenItem = {
  itemCode: string;
  itemName: string;
  itemPrice?: number;
  imageUrl?: string;
  description?: string;
  createdAt?: Date | FirebaseFirestore.Timestamp;
  updatedAt?: Date | FirebaseFirestore.Timestamp;
};

export type MonitoredItem = {
  productName?: string;
  imageUrl?: string;
  price?: number;
  tags?: string[];
  category?: string;
  reviewCount?: number;
  createdAt?: Date | FirebaseFirestore.Timestamp;
  updatedAt?: Date | FirebaseFirestore.Timestamp;
};

// --- 条件判定 -------------------------------------------------------------
export function shouldGenerateSpecialThumbnail(args: {
  item: RakutenItem;
  monitored?: MonitoredItem;
}): boolean {
  const price = args.monitored?.price ?? args.item.itemPrice ?? 0;
  const tags = args.monitored?.tags ?? [];

  const isHighPrice = price >= 10000; // 高単価
  const isFeatured = tags.includes("特集") || tags.includes("注目");

  return isHighPrice || isFeatured;
}

// --- Discover向けの“柔らかい”文言 ---------------------------------------
function buildSoftBadgeText(category?: string, tags?: string[]): string {
  const t = (tags ?? []).find((x) => x.length <= 8);
  if (category === "軽量") return "かるくて便利";
  if (category === "大容量") return "これ1台で安心";
  if (category === "急速充電") return "急いでるときも";
  if (t) return t;
  return "日常にちょうどいい";
}

// --- 生成本体 -------------------------------------------------------------
export async function generateSpecialThumbnail(args: {
  slug: string;
  productImageUrl: string;
  category?: string;
  tags?: string[];
}): Promise<string> {
  const { slug, productImageUrl, category, tags } = args;

  const badge = buildSoftBadgeText(category, tags);

  const url = await composeProductThumbnail({
    productImageUrl,
    titleBadge: badge,
    outPath: `thumbnails/blogs/${slug}-hero.png`,
    badgeAlign: "left",
    width: 1200,
    height: 630,
  });

  await db.collection("blogs").doc(slug).set(
    {
      heroImageUrl: url,
      imageUrl: url, // 一覧が hero 非対応でも表示されるように同期
      heroCaption: "生活イメージ寄りのサムネ（Discover向け）",
      updatedAt: new Date(),
    },
    { merge: true },
  );

  return url;
}
