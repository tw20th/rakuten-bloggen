/* eslint-disable no-console */
import { db, Timestamp } from "../lib/firebase";
import { classifyCategory } from "../utils/classifyCategory";
import { extractCapacity, extractOutputPower } from "../utils/extractSpecs";

const BATCH = 400;

type Monitored = {
  productName?: string;
  itemCode?: string;
  category?: string;
  capacity?: number | null;
  outputPower?: number | null;
};

type RawRakuten = {
  itemName?: string;
  description?: string;
};

async function run(): Promise<void> {
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let total = 0,
    updated = 0;

  while (true) {
    let q = db.collection("monitoredItems").orderBy("__name__").limit(BATCH);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();

    for (const d of snap.docs) {
      total += 1;
      const m = d.data() as Monitored;

      const itemCode = m.itemCode ?? d.id; // monitoredItems は id を '-'、itemCode は ':' なので itemCode 優先
      const rDoc = await db.collection("rakutenItems").doc(itemCode).get();
      const r = (rDoc.exists ? (rDoc.data() as RawRakuten) : {}) || {};

      const name = [m.productName, r.itemName].filter(Boolean).join(" ");
      const desc = r.description ?? "";

      const capacity =
        typeof m.capacity === "number" ? m.capacity : extractCapacity(desc);
      const outputPower =
        typeof m.outputPower === "number"
          ? m.outputPower
          : extractOutputPower(desc);

      const category = classifyCategory({
        itemName: name,
        description: desc,
        capacity: capacity ?? null,
        outputPower: outputPower ?? null,
      });

      if (
        m.category !== category ||
        m.capacity !== capacity ||
        m.outputPower !== outputPower
      ) {
        batch.set(
          d.ref,
          {
            category,
            capacity: capacity ?? null,
            outputPower: outputPower ?? null,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        );
        updated += 1;
      }
    }

    await batch.commit();
    last = snap.docs[snap.docs.length - 1];
  }

  console.log(
    `[backfillCategoryJoinRakuten] total=${total} updated=${updated}`,
  );
}

run().then(() => process.exit(0));
