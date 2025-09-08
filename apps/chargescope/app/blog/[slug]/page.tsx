// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { db } from "@/lib/firebase";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import type { Blog } from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { isTimestamp, tsToISOString } from "@/types";
import { BackLink } from "@/components/common/BackLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import Image from "next/image";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";

// 追加：E-E-A-T用の共通パーツ
import AuthorBox from "@/components/common/AuthorBox";
import AdDisclosure from "@/components/common/AdDisclosure";

// ─────────────────────────────────────────────
// Edge対応：OGは /api/og で生成（クエリ渡し）。Firestoreは使わない。
// ─────────────────────────────────────────────
// app/blog/[slug]/page.tsx （generateMetadataのみ差し替え）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const snap = await db.doc(`blogs/${params.slug}`).get();
  if (!snap.exists) {
    return { title: "記事が見つかりません" };
  }
  const blog = snap.data() as Partial<Blog>;

  const title = blog.title ?? "ブログ記事";
  const desc =
    (blog.content ?? "").replace(/[#*>`_\-\[\]\(\)]/g, "").slice(0, 120) ||
    "ChargeScope の読みもの";

  // 画像URL（Edgeには値だけ渡す）
  const baseImg =
    blog.heroImageUrl ||
    (blog.imageUrl ? upgradeRakutenImageUrl(blog.imageUrl, 1200) : "");

  // ▼ バッジ抽出（tags から推定 / 日本語・英語どちらでもOK）
  const rawTags = (blog.tags ?? []).map((t) => String(t).toLowerCase());
  const hasLight =
    rawTags.includes("light") ||
    rawTags.includes("軽量") ||
    rawTags.includes("軽い");
  const hasLarge =
    rawTags.includes("large") ||
    rawTags.includes("大容量") ||
    rawTags.some((t) => /20,?000|20000|mAh/.test(t)); // ゆるめ検知
  const hasFast =
    rawTags.includes("fast-charge") ||
    rawTags.includes("急速充電") ||
    rawTags.some((t) => /(65|67|100|140)w/.test(t)); // 出力系

  const badgeLabels = [
    hasLight ? "軽量" : null,
    hasLarge ? "大容量" : null,
    hasFast ? "急速充電" : null,
  ].filter(Boolean) as string[];

  const paramsObj = new URLSearchParams();
  paramsObj.set("title", title.slice(0, 80));
  if (baseImg) paramsObj.set("img", baseImg);
  if (badgeLabels.length) paramsObj.set("badges", badgeLabels.join(","));

  const ogImage = `${SITE_URL}/api/og?${paramsObj.toString()}`;

  return {
    title,
    description: desc,
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${params.slug}`,
      siteName: "ChargeScope",
      title,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

// ─────────────────────────────────────────────

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();
  if (!blogSnap.exists) notFound();

  const rawBlog = blogSnap.data() as Blog;

  // views +1（失敗は握りつぶし）
  blogRef.update({ views: FieldValue.increment(1) }).catch(() => {});

  const createdAtString = tsToISOString(rawBlog.createdAt);

  // ヒーロー画像優先順位：heroImageUrl > imageUrl(楽天補正)
  const heroSrc =
    rawBlog.heroImageUrl ??
    (rawBlog.imageUrl ? upgradeRakutenImageUrl(rawBlog.imageUrl, 1200) : null);

  const heroCaption =
    rawBlog.heroCaption ??
    (rawBlog.heroImageUrl ? "画像：商品公式を加工（背景合成）" : undefined);

  // 関連アイテム
  const itemRef = db.doc(`rakutenItems/${rawBlog.relatedItemCode}`);
  const itemSnap = await itemRef.get();
  const rawItem = itemSnap.exists ? (itemSnap.data() as Item) : null;

  const relatedItem = rawItem
    ? {
        ...rawItem,
        createdAt: isTimestamp(rawItem.createdAt)
          ? rawItem.createdAt.toDate().toISOString()
          : typeof rawItem.createdAt === "string"
          ? rawItem.createdAt
          : "",
      }
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "ホーム" },
          { href: "/blog", label: "読みもの" },
          { href: `/blog/${rawBlog.slug}`, label: rawBlog.title },
        ]}
      />

      <div className="mb-4">
        <BackLink />
      </div>

      <h1 className="text-3xl font-bold mb-4">{rawBlog.title}</h1>

      {heroSrc && (
        <figure className="mb-6">
          <Image
            src={heroSrc}
            alt={rawBlog.title}
            width={1200}
            height={630}
            sizes="(max-width: 768px) 92vw, 1200px"
            priority
            className="rounded-xl object-cover bg-white"
          />
          {heroCaption && (
            <figcaption className="mt-2 text-xs text-gray-500">
              {heroCaption}
            </figcaption>
          )}
        </figure>
      )}

      <p className="text-sm text-gray-500 mb-6">
        {createdAtString ? new Date(createdAtString).toLocaleDateString() : ""}
        {rawBlog.category ? (
          <span className="ml-2">/ {rawBlog.category}</span>
        ) : null}
      </p>

      {/* 本文 */}
      <Markdown content={rawBlog.content} />

      {/* 広告表記（CTA付近が理想だが、下部でもOK） */}
      <AdDisclosure />

      {/* 著者ボックス（E-E-A-T） */}
      <AuthorBox
        name="運営：ChargeScope編集部"
        title="バッテリー／充電器レビュー"
        bio="通勤・出張・キャンプの“充電の困りごと”を一次情報で解決します。検証は重量・サイズ・実測出力の3点基準。"
        avatarUrl="/author.jpg"
        sns={[
          { label: "X", url: "https://x.com/" },
          { label: "お問い合わせ", url: "/contact" },
        ]}
      />

      {/* 関連商品 */}
      {relatedItem && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">関連商品</h2>
          <RelatedProduct item={relatedItem} />
        </div>
      )}
    </div>
  );
}
