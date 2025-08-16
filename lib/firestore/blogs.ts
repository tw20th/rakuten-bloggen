import { db } from "@/lib/firebase";
import type { Blog, BlogClient } from "@/types";
import { tsToISOString } from "@/types"; // ★ 追加

export const getAllBlogs = async (): Promise<Blog[]> => {
  const snapshot = await db.collection("blogs").get();
  return snapshot.docs.map((d) => d.data() as Blog);
};

export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  const snap = await db.collection("blogs").doc(slug).get();
  return snap.exists ? (snap.data() as Blog) : null;
};

export async function fetchBlogsPageServer(params: {
  pageSize?: number;
  sort?: "newest" | "oldest" | "popular";
  tag?: string;
}): Promise<{ items: BlogClient[]; nextCursor?: string }> {
  const { pageSize = 10, sort = "newest", tag } = params;

  let q = db.collection("blogs") as FirebaseFirestore.Query;
  if (tag) q = q.where("tags", "array-contains", tag);

  if (sort === "popular") q = q.orderBy("views", "desc");
  else q = q.orderBy("createdAt", sort === "oldest" ? "asc" : "desc");

  q = q.limit(pageSize);

  const snap = await q.get();

  const items: BlogClient[] = snap.docs.map((d) => {
    const b = d.data() as Blog;
    return {
      title: b.title,
      content: b.content,
      category: b.category,
      tags: b.tags,
      slug: b.slug,
      imageUrl: b.imageUrl,
      relatedItemCode: b.relatedItemCode,
      status: b.status,
      views: b.views,
      createdAt: tsToISOString(b.createdAt),
      updatedAt: tsToISOString(b.updatedAt),
    };
  });

  const nextCursor =
    snap.docs.length === pageSize
      ? snap.docs[snap.docs.length - 1].id
      : undefined;

  return { items, nextCursor };
}
