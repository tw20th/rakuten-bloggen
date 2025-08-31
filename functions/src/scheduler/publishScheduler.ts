// functions/src/scheduler/publishScheduler.ts
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import { generateOgImageForSlug } from "../seo/generateOgImage";
import {
  buildArticleJsonLd,
  buildBreadcrumbLd,
  buildFaqJsonLd,
} from "../seo/applyStructuredData";
import { revalidate } from "../seo/triggerRevalidate";
import { Timestamp } from "firebase-admin/firestore";

const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rakuten-bloggen.vercel.app";
const AUTHOR = "ChargeScope";

// draft から n件を publish、公開後に OGP/構造化/再検証を連鎖
export async function publishScheduler(n = 2) {
  const q = await db
    .collection("blogs")
    .where("status", "==", "draft")
    .orderBy("createdAt", "asc")
    .limit(n)
    .get();

  if (q.empty) {
    logger.info("publishScheduler: draftなし");
    return [];
  }

  const published: string[] = [];

  for (const doc of q.docs) {
    const b = doc.data() as {
      slug: string;
      title: string;
      content: string;
      category?: string;
      imageUrl?: string;
      tags?: string[];
    };

    const url = `${SITE_BASE}/blog/${b.slug}`;

    // 1) OGP
    const og = await generateOgImageForSlug({
      slug: b.slug,
      title: b.title,
      image: b.imageUrl,
    });

    // 2) JSON-LD
    const breadcrumb = [
      { name: "ホーム", url: SITE_BASE },
      { name: "ブログ", url: `${SITE_BASE}/blog` },
      ...(b.category
        ? [
            {
              name: b.category,
              url: `${SITE_BASE}/blog?tag=${encodeURIComponent(b.category)}`,
            },
          ]
        : []),
      { name: b.title, url },
    ];
    const articleLd = buildArticleJsonLd({
      url,
      title: b.title,
      description: (b.content || "").replace(/\s+/g, " ").slice(0, 160),
      image: og || b.imageUrl,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: AUTHOR,
    });
    const breadcrumbLd = buildBreadcrumbLd(breadcrumb);
    const faqLd = buildFaqJsonLd([]); // ← 後で抽出ロジックを追加予定

    // 3) Publish & 保存
    await doc.ref.update({
      status: "published",
      updatedAt: Timestamp.now(),
      imageUrlOG: og,
      jsonLd: [articleLd, breadcrumbLd, faqLd].filter(Boolean),
    });

    // 4) Revalidate（トップ & 記事）
    await revalidate("/");
    await revalidate(`/blog/${b.slug}`);

    published.push(b.slug);
    logger.info("published:", b.slug);
  }

  return published;
}
