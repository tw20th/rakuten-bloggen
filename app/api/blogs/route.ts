// app/api/blogs/route.ts
import { fetchBlogsPage } from "@/lib/firestore/blogs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const { items, nextCursor } = await fetchBlogsPage({ cursor });
  return NextResponse.json({ items, nextCursor });
}
