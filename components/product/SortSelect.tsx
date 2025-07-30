"use client";

type SortBy = "createdAt" | "price" | "capacity";
type SortOrder = "asc" | "desc";

type Props = {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortByChange: (value: SortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
};

export function SortSelect({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: Props) {
  return (
    <div className="flex gap-2 items-center mb-4">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortBy)}
        className="border px-3 py-1 rounded"
      >
        <option value="createdAt">新着順</option>
        <option value="price">価格順</option>
        <option value="capacity">容量順</option>
      </select>

      <select
        value={sortOrder}
        onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
        className="border px-3 py-1 rounded"
      >
        <option value="desc">降順</option>
        <option value="asc">昇順</option>
      </select>
    </div>
  );
}
