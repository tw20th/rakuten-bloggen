import { db } from "@/lib/firebase";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import type { Blog } from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { isTimestamp, tsToISOString } from "@/types"; // ★ 追加

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();
  if (!blogSnap.exists) notFound();

  const rawBlog = blogSnap.data() as Blog;

  // views +1（非同期で実行）
  blogRef.update({ views: FieldValue.increment(1) }).catch((e) => {
    console.error("views update failed:", e);
  });

  const createdAtString = tsToISOString(rawBlog.createdAt);

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
      <h1 className="text-3xl font-bold mb-4">{rawBlog.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {createdAtString ? new Date(createdAtString).toLocaleDateString() : ""}
      </p>

      <Markdown content={rawBlog.content} />

      {relatedItem && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">関連商品</h2>
          <RelatedProduct item={relatedItem} />
        </div>
      )}
    </div>
  );
}
