import { dbAdmin } from "@/lib/firebaseAdmin";
import type { Blog, BlogClient } from "@/types";
import { tsToISOString } from "@/types";

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
  cursor?: string; // 次ページ用カーソル（docId）
  siteKey?: string; // ← 追加：サイト識別子（指定時のみ絞り込み）
}): Promise<{ items: BlogClient[]; nextCursor?: string }> {
  const { pageSize = 10, sort = "newest", tag, cursor, siteKey } = params;

  let q = dbAdmin
    .collection("blogs")
    .where("status", "==", "published") as FirebaseFirestore.Query;

  if (siteKey) q = q.where("siteKey", "==", siteKey); // ← PowerPostだけ取得
  if (tag) q = q.where("tags", "array-contains", tag);

  if (sort === "popular") {
    q = q.orderBy("views", "desc").orderBy("createdAt", "desc");
  } else {
    q = q.orderBy("createdAt", sort === "oldest" ? "asc" : "desc");
  }

  if (cursor) {
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
      siteKey: b.siteKey, // ← 追加（optionalなのでそのまま）
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
