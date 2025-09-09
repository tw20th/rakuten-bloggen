import { NextResponse } from "next/server";
import { fetchBlogsPageServer } from "@/lib/firestore/blogs";
import { siteConfig } from "@/site.config"; // ★ 追加

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const cursor = searchParams.get("cursor") ?? undefined;
  const sortParam = (searchParams.get("sort") ?? "newest") as
    | "newest"
    | "popular"
    | "oldest";
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") ?? 10), 1),
    50
  );
  const tag = searchParams.get("tag") ?? undefined;

  const sort: "newest" | "popular" | "oldest" =
    sortParam === "popular"
      ? "popular"
      : sortParam === "oldest"
      ? "oldest"
      : "newest";

  try {
    const { items, nextCursor } = await fetchBlogsPageServer({
      cursor,
      sort,
      tag,
      pageSize,
      siteKey: siteConfig.siteKey, // ★ power-post のみ
    });
    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("[API /api/blogs] ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
