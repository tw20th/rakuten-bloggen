import { db } from "@/lib/firebase";
import Markdown from "@/components/ui/Markdown";
import RelatedProduct from "@/components/blog/RelatedProduct";
import { notFound } from "next/navigation";
import type { Item } from "@/types/item";
import type { Blog } from "@/types/blog";

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogRef = db.doc(`blogs/${params.slug}`);
  const blogSnap = await blogRef.get();

  if (!blogSnap.exists) {
    notFound();
  }

  const rawBlog = blogSnap.data() as Blog;
  const blog: Blog & { createdAtString?: string } = {
    ...rawBlog,
    createdAtString: rawBlog.createdAt?.toDate().toISOString(),
  };

  const itemRef = db.doc(`rakutenItems/${rawBlog.relatedItemCode}`);
  const itemSnap = await itemRef.get();

  const rawItem = itemSnap.exists ? (itemSnap.data() as Item) : null;
  const relatedItem = rawItem
    ? {
        ...rawItem,
        // もし createdAt など Timestamp を含んでいるなら変換（任意）
        createdAt: rawItem.createdAt?.toDate().toISOString() ?? "",
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
