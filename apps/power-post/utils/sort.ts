// ---- Product ----
export type ProductSortKey =
  | "popular" // views desc
  | "cheap" // price asc
  | "newest" // createdAt desc
  | "capacity-desc" // capacity desc
  | "capacity-asc" // capacity asc
  | "rating-desc"; // reviewAverage desc

export const PRODUCT_SORT_OPTIONS: Array<{
  key: ProductSortKey;
  label: string;
}> = [
  { key: "popular", label: "人気順" },
  { key: "cheap", label: "価格の安い順" },
  { key: "newest", label: "新着順" },
  { key: "capacity-desc", label: "容量が大きい順" },
  { key: "capacity-asc", label: "容量が小さい順" },
  { key: "rating-desc", label: "評価が高い順" },
];

export function parseProductSortKey(v: unknown): ProductSortKey {
  const s = String(v ?? "");
  const all = new Set(PRODUCT_SORT_OPTIONS.map((o) => o.key));
  return all.has(s as ProductSortKey) ? (s as ProductSortKey) : "popular";
}

export function productSortToFirestore(key: ProductSortKey): {
  field: "views" | "price" | "createdAt" | "capacity" | "reviewAverage";
  direction: "asc" | "desc";
} {
  switch (key) {
    case "cheap":
      return { field: "price", direction: "asc" };
    case "newest":
      return { field: "createdAt", direction: "desc" };
    case "capacity-desc":
      return { field: "capacity", direction: "desc" };
    case "capacity-asc":
      return { field: "capacity", direction: "asc" };
    case "rating-desc":
      return { field: "reviewAverage", direction: "desc" };
    case "popular":
    default:
      return { field: "views", direction: "desc" };
  }
}

// ---- Blog ----
export type BlogSortKey = "newest" | "popular" | "oldest";

export const BLOG_SORT_OPTIONS: Array<{ key: BlogSortKey; label: string }> = [
  { key: "newest", label: "新着順" },
  { key: "popular", label: "人気順" },
  { key: "oldest", label: "古い順" },
];

export function parseBlogSortKey(v: unknown): BlogSortKey {
  const s = String(v ?? "");
  return s === "popular" || s === "oldest" ? s : "newest";
}

// ✅ 追加：Blog専用 Firestore 変換（ここを使う）
export function blogSortToFirestore(key: BlogSortKey): {
  field: "createdAt" | "views";
  direction: "asc" | "desc";
} {
  switch (key) {
    case "oldest":
      return { field: "createdAt", direction: "asc" };
    case "popular":
      return { field: "views", direction: "desc" };
    case "newest":
    default:
      return { field: "createdAt", direction: "desc" };
  }
}

// ---- 共通（必要なら使う。重複キー問題を避けるため scope を必須/既定化）----
export type SortKey = ProductSortKey | BlogSortKey;

export function parseSortKey(v: unknown): SortKey {
  const s = String(v ?? "");
  if (PRODUCT_SORT_OPTIONS.some((o) => o.key === s)) return s as ProductSortKey;
  if (BLOG_SORT_OPTIONS.some((o) => o.key === s)) return s as BlogSortKey;
  return "newest";
}

// ★ ラッパ：用途を明示（既定は product）
export function sortToFirestore(
  key: SortKey,
  scope: "product" | "blog" = "product"
): { field: string; direction: "asc" | "desc" } {
  if (scope === "blog") {
    const { field, direction } = blogSortToFirestore(key as BlogSortKey);
    return { field, direction };
  }
  const { field, direction } = productSortToFirestore(key as ProductSortKey);
  return { field, direction };
}

// UIオプション（必要なら用途別に）
export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  ...PRODUCT_SORT_OPTIONS,
  ...BLOG_SORT_OPTIONS,
];
