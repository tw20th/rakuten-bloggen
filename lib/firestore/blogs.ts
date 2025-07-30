import {
  collection,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import type { BlogType } from "@/types";

type BlogQuery = {
  sort?: "newest" | "popular";
  tag?: string;
  pageSize?: number;
};

// 👇 これが必要！
export async function fetchBlogsPage({
  cursor,
  query: queryParams,
}: {
  cursor?: string;
  query?: BlogQuery;
}) {
  const col = collection(db, "blogs");

  let q = query(col);

  // 🔽 タグフィルタ
  if (queryParams?.tag) {
    q = query(q, where("tags", "array-contains", queryParams.tag));
  }

  // 🔽 ソートとページング
  const orderField = queryParams?.sort === "popular" ? "views" : "createdAt";
  const pageSize = queryParams?.pageSize || 10;

  if (cursor) {
    const cursorSnap = await getDoc(doc(col, cursor));
    if (!cursorSnap.exists()) throw new Error("Invalid cursor");

    q = query(
      q,
      orderBy(orderField, "desc"),
      startAfter(cursorSnap),
      limit(pageSize)
    );
  } else {
    q = query(q, orderBy(orderField, "desc"), limit(pageSize));
  }

  const snapshot = await getDocs(q);
  const items: BlogType[] = snapshot.docs.map((doc) => ({
    ...(doc.data() as Omit<BlogType, "id">),
    id: doc.id,
  }));

  const nextCursor =
    snapshot.docs.length > 0 ? snapshot.docs.at(-1)?.id : undefined;

  return { items, nextCursor };
}
export async function getInitialBlogs({
  sort,
  tag,
  pageSize,
}: {
  sort?: "newest" | "popular";
  tag?: string;
  pageSize?: number;
}) {
  return await fetchBlogsPage({
    query: {
      sort,
      tag,
      pageSize,
    },
  });
}
