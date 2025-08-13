import { db } from "@/lib/firebase";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import { BlogType as Blog } from "@/types/blog";
import { Timestamp, FieldValue } from "firebase-admin/firestore"; // 👈 FieldValue を追加

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // ブログ取得
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();

  if (!blogSnap.exists) {
    notFound();
  }

  const rawBlog = blogSnap.data() as Blog;

  // 👁️ views を +1 で更新（非同期・待たずに実行）
  blogRef
    .update({ views: FieldValue.increment(1) })
    .catch((e) => console.error("views update failed:", e));

  const blog: Blog & { createdAtString?: string } = {
    ...rawBlog,
    createdAtString:
      rawBlog.createdAt instanceof Timestamp
        ? rawBlog.createdAt.toDate().toISOString()
        : typeof rawBlog.createdAt === "string"
        ? rawBlog.createdAt
        : "",
  };

  // 関連アイテム取得（relatedItemCode が定義されている前提）
  const itemRef = db.doc(`rakutenItems/${rawBlog.relatedItemCode}`);
  const itemSnap = await itemRef.get();

  const rawItem = itemSnap.exists ? (itemSnap.data() as Item) : null;

  const relatedItem = rawItem
    ? {
        ...rawItem,
        createdAt:
          rawItem.createdAt instanceof Timestamp
            ? rawItem.createdAt.toDate().toISOString()
            : typeof rawItem.createdAt === "string"
            ? rawItem.createdAt
            : "",
      }
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {new Date(blog.createdAtString!).toLocaleDateString()}
      </p>

      <Markdown content={blog.content} />

      {relatedItem && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">関連商品</h2>
          <RelatedProduct item={relatedItem} />
        </div>
      )}
    </div>
  );
}
