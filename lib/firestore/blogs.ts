// lib/firebase/blogs.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Blog } from "@/types";

export const getAllBlogs = async (): Promise<Blog[]> => {
  const snapshot = await getDocs(collection(db, "blogs"));
  return snapshot.docs.map((doc) => doc.data() as Blog);
};

export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  const ref = doc(db, "blogs", slug);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Blog;
};
