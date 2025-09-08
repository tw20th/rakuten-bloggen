// utils/serializeFirestore.ts
import type { Timestamp } from "firebase-admin/firestore";

type TimestampLike = { toDate: () => Date };

function isTimestampLike(val: unknown): val is TimestampLike {
  return (
    typeof val === "object" &&
    val !== null &&
    "toDate" in (val as Record<string, unknown>) &&
    typeof (val as { toDate?: unknown }).toDate === "function"
  );
}

// ここを追加（オーバーロード）
export function serializeFirestore<T extends Record<string, unknown>>(
  value: T
): Record<string, unknown>;
export function serializeFirestore(value: unknown): unknown;

export function serializeFirestore(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (isTimestampLike(value)) {
    try {
      const d = (value as Timestamp).toDate();
      if (d instanceof Date && !Number.isNaN(d.valueOf()))
        return d.toISOString();
    } catch {
      /* noop */
    }
  }

  if (Array.isArray(value)) return value.map(serializeFirestore);

  if (Object.prototype.toString.call(value) === "[object Object]") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeFirestore(v);
    }
    return out;
  }

  return value;
}
