import { db } from "@/lib/firebase";
import { Blog } from "@/types/blog";

type SerializableBlog = Omit<Blog, "createdAt"> & {
  createdAt: string; // ISO文字列に変換
};

export async function fetchBlogsPage({ cursor }: { cursor?: string }) {
  let q = db
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(10);

  if (cursor) {
    const after = new Date(cursor);
    q = q.startAfter(after);
  }

  const snap = await q.get();
  const items: SerializableBlog[] = snap.docs.map((doc) => {
    const data = doc.data() as Blog;
    return {
      ...data,
      createdAt: data.createdAt.toDate().toISOString(), // ← ここで変換
    };
  });

  const nextCursor = items.at(-1)?.createdAt;

  return { items, nextCursor };
}
