import { db } from "@/lib/firebaseClient";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import { BlogType as Blog } from "@/types/blog";

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // ブログ取得
  const blogRef = doc(db, `blogs/${params.slug}`);
  const blogSnap = await getDoc(blogRef);

  if (!blogSnap.exists()) {
    notFound();
  }

  const rawBlog = blogSnap.data() as Blog;

  const blog: Blog & { createdAtString?: string } = {
    ...rawBlog,
    createdAtString:
      rawBlog.createdAt instanceof Timestamp
        ? rawBlog.createdAt.toDate().toISOString()
        : typeof rawBlog.createdAt === "string"
        ? rawBlog.createdAt
        : "",
  };

  // 関連アイテム取得
  const itemRef = doc(db, `rakutenItems/${rawBlog.relatedItemCode}`);
  const itemSnap = await getDoc(itemRef);

  const rawItem = itemSnap.exists() ? (itemSnap.data() as Item) : null;

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
