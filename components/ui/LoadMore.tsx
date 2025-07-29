// components/ui/LoadMore.tsx
type Props = {
  onClick: () => void;
  loading: boolean;
};

export default function LoadMore({ onClick, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "読み込み中…" : "もっと見る"}
    </button>
  );
}
