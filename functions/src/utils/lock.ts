import { db } from "../lib/firebase";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/** Firestoreベースの超簡易ロック。ttlSec 内に再実行を抑止 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSec = 15 * 60,
): Promise<T | void> {
  const ref = db.collection("_locks").doc(key);
  const snap = await ref.get();

  const now = Date.now();
  if (snap.exists) {
    const startedAt = snap.get("startedAt") as
      | FirebaseFirestore.Timestamp
      | undefined;
    if (startedAt && now - startedAt.toDate().getTime() < ttlSec * 1000) {
      logger.warn(`[LOCK] ${key} is running. skip.`);
      return;
    }
  }

  await ref.set({ startedAt: Timestamp.now() });
  try {
    return await fn();
  } finally {
    await ref.delete().catch(() => {});
  }
}
