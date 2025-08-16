// types/firestore.ts
export type TSOrString =
  | FirebaseFirestore.Timestamp
  | { toDate: () => Date } // client Timestamp（最低限）
  | string;

// toDate を持つかの型ガード
export function isTimestamp(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { toDate?: unknown }).toDate === "function"
  );
}

// ISO文字列へ正規化
export function tsToISOString(v: TSOrString): string {
  if (typeof v === "string") return v;
  if (isTimestamp(v)) return v.toDate().toISOString();
  return "";
}
