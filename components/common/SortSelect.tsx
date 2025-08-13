import React from "react";

type SortOption = {
  label: string;
  value: string;
};

type SortSelectProps = {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
};

export const SortSelect: React.FC<SortSelectProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="inline-block">
      <select
        className="border rounded px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
