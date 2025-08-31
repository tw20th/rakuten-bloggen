//app/blog/[slug]/page.tsx
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

// ★ 追加（すでに作ってある前提。未作成なら僕が出した実装をコピペでOK）
import AuthorBox from "@/components/common/AuthorBox";
import AdDisclosure from "@/components/common/AdDisclosure";

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();
  if (!blogSnap.exists) notFound();

  const rawBlog = blogSnap.data() as Blog;

  // views +1（失敗は握り潰し）
  blogRef.update({ views: FieldValue.increment(1) }).catch(() => {});

  const createdAtString = tsToISOString(rawBlog.createdAt);

  // ★ ヒーロー画像優先順位：heroImageUrl > imageUrl(楽天補正)
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

      {/* ★ 広告表記（CTA付近が理想だが、ブログ下部でもOK） */}
      <AdDisclosure />

      {/* ★ 著者ボックス（E-E-A-T） */}
      <AuthorBox
        name="運営：ChargeScope編集部"
        title="バッテリー／充電器レビュー"
        bio="通勤・出張・キャンプの“充電の困りごと”を一次情報で解決します。検証は重量・サイズ・実測出力の3点基準。"
        avatarUrl="/author.jpg" // 適宜差し替え
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
