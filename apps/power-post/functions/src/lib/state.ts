import { db } from "../lib/firebase";

const COLL = "schedulers";
const DOC = "blogGeneration";

export type GenState = {
  lastItemCode?: string;
  lastRunAt?: FirebaseFirestore.Timestamp;
};

export async function getGenState(): Promise<GenState> {
  const ref = db.collection(COLL).doc(DOC);
  const snap = await ref.get();
  return (snap.exists ? (snap.data() as GenState) : {}) || {};
}

export async function setGenState(patch: Partial<GenState>) {
  const ref = db.collection(COLL).doc(DOC);
  await ref.set(
    {
      ...patch,
      lastRunAt: new Date(),
    },
    { merge: true },
  );
}
