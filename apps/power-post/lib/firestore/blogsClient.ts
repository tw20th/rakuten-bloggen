// apps/power-post/lib/firestore/blogsClient.ts
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  startAfter,
  doc,
  getDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { dbClient } from "@/lib/firebaseClient";
import type { BlogClient } from "@/types";

type BlogDoc = {
  title: string;
  content: string;
  category: string;
  tags: string[];
  slug: string;
  imageUrl: string;
  relatedItemCode: string;
  status: "draft" | "published";
  views: number;
  createdAt: { toDate: () => Date } | string;
  updatedAt: { toDate: () => Date } | string;
  siteKey?: string; // ← 追加
};

type FetchParams = {
  pageSize?: number;
  sort?: "newest" | "oldest" | "popular";
  cursor?: string;
  tag?: string;
  siteKey?: string; // （使うなら）クライアント側でも絞り込み可
};

export async function fetchBlogsPage({
  pageSize = 20,
  sort = "newest",
  cursor,
  tag,
  siteKey,
}: FetchParams) {
  const colRef = collection(dbClient, "blogs");
  const constraints: QueryConstraint[] = [];

  // 絞り込み
  constraints.push(where("status", "==", "published"));
  if (siteKey) constraints.push(where("siteKey", "==", siteKey));
  if (tag) constraints.push(where("tags", "array-contains", tag));

  // 並び替え
  if (sort === "popular")
    constraints.push(orderBy("views", "desc"), orderBy("createdAt", "desc"));
  else
    constraints.push(orderBy("createdAt", sort === "oldest" ? "asc" : "desc"));

  // カーソル
  if (cursor) {
    const curRef = doc(dbClient, "blogs", cursor);
    const curSnap = await getDoc(curRef);
    if (curSnap.exists()) constraints.push(startAfter(curSnap));
  }

  constraints.push(limit(pageSize));

  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);

  const items: BlogClient[] = snap.docs.map((d) => {
    const data = d.data() as BlogDoc;
    const toISO = (v: BlogDoc["createdAt"]) =>
      typeof v === "string" ? v : v.toDate().toISOString();

    return {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      slug: data.slug,
      imageUrl: data.imageUrl,
      relatedItemCode: data.relatedItemCode,
      status: data.status,
      views: data.views ?? 0,
      siteKey: data.siteKey, // ← 追加（optional）
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    };
  });

  const nextCursor =
    snap.docs.length === pageSize
      ? snap.docs[snap.docs.length - 1].id
      : undefined;

  return { items, nextCursor };
}
