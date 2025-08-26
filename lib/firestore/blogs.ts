// lib/firestore/blogs.ts
import { dbAdmin } from "@/lib/firebaseAdmin"; // ★ Admin SDK を使用
import type { Blog, BlogClient } from "@/types";
import { tsToISOString } from "@/types";

// 既存の getAll/getBlog は未使用なら削除可。使う場合は Admin に寄せるのが安全。
export const getAllBlogs = async (): Promise<Blog[]> => {
  const snapshot = await dbAdmin.collection("blogs").get();
  return snapshot.docs.map((d) => d.data() as Blog);
};

export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  const snap = await dbAdmin.collection("blogs").doc(slug).get();
  return snap.exists ? (snap.data() as Blog) : null;
};

export async function fetchBlogsPageServer(params: {
  pageSize?: number;
  sort?: "newest" | "oldest" | "popular";
  tag?: string;
  cursor?: string; // ★ 追加: 次ページ用カーソル(docId)
}): Promise<{ items: BlogClient[]; nextCursor?: string }> {
  const { pageSize = 10, sort = "newest", tag, cursor } = params;

  let q = dbAdmin
    .collection("blogs")
    .where("status", "==", "published") as FirebaseFirestore.Query;

  if (tag) q = q.where("tags", "array-contains", tag);

  if (sort === "popular") {
    // 人気順は views desc → createdAt desc のセカンダリキー
    q = q.orderBy("views", "desc").orderBy("createdAt", "desc");
  } else {
    q = q.orderBy("createdAt", sort === "oldest" ? "asc" : "desc");
  }

  if (cursor) {
    // ★ docId カーソルを DocumentSnapshot 経由で適用（Admin SDKでも可）
    const curSnap = await dbAdmin.collection("blogs").doc(cursor).get();
    if (curSnap.exists) q = q.startAfter(curSnap);
  }

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
      views: b.views ?? 0,
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
