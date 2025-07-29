// lib/firestore/blogs.ts
import { dbClient as db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type { BlogType } from "@/types";

/**
 * 全ブログ記事を取得（createdAt の新しい順）
 */
export async function getAllBlogs(): Promise<BlogType[]> {
  const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseBlogDoc);
}

/**
 * ページネーション付きでブログ記事を取得
 */
export type FetchBlogsPageParams = {
  cursor?: string; // 直前のドキュメントID
  sort?: "newest" | "oldest";
  tag?: string;
};

export async function fetchBlogsPage({
  cursor,
  sort = "newest",
  tag,
}: FetchBlogsPageParams): Promise<{
  items: BlogType[];
  nextCursor?: string;
}> {
  const blogsRef = collection(db, "blogs");
  const direction = sort === "oldest" ? "asc" : "desc";

  const constraints: QueryConstraint[] = [
    where("status", "==", "published"), // ✅ ここ追加！
    orderBy("createdAt", direction),
    limit(10),
  ];

  if (tag) {
    constraints.push(where("tags", "array-contains", tag));
  }

  if (cursor) {
    const cursorDoc = await getDoc(doc(db, "blogs", cursor));
    if (cursorDoc.exists()) {
      constraints.push(startAfter(cursorDoc));
    }
  }

  const q = query(blogsRef, ...constraints);
  const snapshot = await getDocs(q);

  const items = snapshot.docs.map(parseBlogDoc);
  const nextCursor =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1].id
      : undefined;

  return { items, nextCursor };
}
/**
 * Firestore の生スナップショットから BlogType へ整形
 */
function parseBlogDoc(snap: QueryDocumentSnapshot<DocumentData>): BlogType {
  const data = snap.data();

  return {
    slug: data.slug ?? snap.id,
    title: data.title,
    content: data.content,
    tags: data.tags ?? [],
    views: data.views ?? 0,
    status: data.status ?? "draft",
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : new Date(),
    summary: data.summary ?? "",
    analysisHistory: data.analysisHistory ?? [],
    aiSummary: data.aiSummary ?? "",
    imageUrl: data.imageUrl ?? "",
    category: data.category ?? "",
    productId: data.productId ?? "",
    relatedItemCode: data.relatedItemCode ?? "", // 空文字などで fallback
  };
}
