// app/api/blogs/route.ts
import { NextResponse } from "next/server";
import { fetchBlogsPage } from "@/lib/firestore/blogs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const cursor = searchParams.get("cursor") ?? undefined;
  const sort = (searchParams.get("sort") ?? "newest") as "newest" | "oldest";
  const tag = searchParams.get("tag") ?? undefined;

  try {
    const { items, nextCursor } = await fetchBlogsPage({ cursor, sort, tag });
    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("[API: /api/blogs]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
