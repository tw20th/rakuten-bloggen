"use client";

type Props = {
  hasTypeC?: boolean;
  minCapacity?: number;
  onHasTypeCChange: (value: boolean | undefined) => void;
  onMinCapacityChange: (value: number | undefined) => void;
};

export function FilterPanel({
  hasTypeC,
  minCapacity,
  onHasTypeCChange,
  onMinCapacityChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasTypeC ?? false}
          onChange={(e) =>
            onHasTypeCChange(e.target.checked ? true : undefined)
          }
        />
        Type-C対応
      </label>

      <label>
        最低容量（mAh）:
        <input
          type="number"
          value={minCapacity ?? ""}
          onChange={(e) =>
            onMinCapacityChange(
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          className="ml-2 border px-2 py-1 w-24 rounded"
        />
      </label>
    </div>
  );
}
