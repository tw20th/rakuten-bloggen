// app/api/products/route.ts
import { NextResponse } from "next/server";
import { fetchProductsPage } from "@/lib/server/products";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "20");

  // ✅ "newest" または "popular" に限定（型安全）
  const rawSort = searchParams.get("sort");
  const sort = rawSort === "popular" ? "popular" : "newest";

  const filters = {
    hasTypeC:
      searchParams.get("hasTypeC") === "true"
        ? true
        : searchParams.get("hasTypeC") === "false"
        ? false
        : undefined,
    category: searchParams.get("category") ?? undefined,
    minCapacity: searchParams.get("minCapacity")
      ? Number(searchParams.get("minCapacity"))
      : undefined,
    maxWeight: searchParams.get("maxWeight")
      ? Number(searchParams.get("maxWeight"))
      : undefined,
    tags: searchParams.get("tags")?.split(",").filter(Boolean),
  };

  const data = await fetchProductsPage({ cursor, limit, sort, filters });
  return NextResponse.json(data);
}
