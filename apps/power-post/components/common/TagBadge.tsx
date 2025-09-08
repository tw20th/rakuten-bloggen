// components/common/TagBadge.tsx
type Props = {
  label: string;
};

export function TagBadge({ label }: Props) {
  return (
    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
      #{label}
    </span>
  );
}
