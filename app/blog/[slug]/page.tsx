// app/blog/[slug]/page.tsx
import { db } from "@/lib/firebase";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import type { Blog } from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { isTimestamp, tsToISOString } from "@/types";

// ★ 追加：共通UI
import { BackLink } from "@/components/common/BackLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();
  if (!blogSnap.exists) notFound();

  const rawBlog = blogSnap.data() as Blog;

  // views +1（失敗しても致命ではないので握りつぶし）
  blogRef.update({ views: FieldValue.increment(1) }).catch((e) => {
    console.error("views update failed:", e);
  });

  const createdAtString = tsToISOString(rawBlog.createdAt);

  // 関連アイテム（存在しない場合は null）
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
      {/* ▼ パンくず（SEO/回遊） */}
      <Breadcrumbs
        items={[
          { href: "/", label: "ホーム" },
          { href: "/blog", label: "読みもの" },
          { href: `/blog/${rawBlog.slug}`, label: rawBlog.title },
        ]}
      />

      {/* ▼ 戻る導線 */}
      <div className="mb-4">
        <BackLink />
      </div>

      {/* タイトル */}
      <h1 className="text-3xl font-bold mb-4">{rawBlog.title}</h1>

      {/* メタ情報 */}
      <p className="text-sm text-gray-500 mb-6">
        {createdAtString ? new Date(createdAtString).toLocaleDateString() : ""}
        {rawBlog.category ? (
          <span className="ml-2">/ {rawBlog.category}</span>
        ) : null}
      </p>

      {/* 本文（Markdownレンダラ） */}
      <Markdown content={rawBlog.content} />

      {/* 関連商品（任意表示） */}
      {relatedItem && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">関連商品</h2>
          <RelatedProduct item={relatedItem} />
        </div>
      )}
    </div>
  );
}
