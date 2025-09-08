import React from "react";

export type SortOption = { label: string; value: string };

type SortSelectProps = {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export const SortSelect: React.FC<SortSelectProps> = ({
  options,
  value,
  onChange,
  id = "sort",
}) => {
  return (
    <label className="inline-flex items-center gap-2 text-sm" htmlFor={id}>
      並び替え
      <select
        id={id}
        className="border rounded-md px-3 py-2 text-sm bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};
