import { db } from "../lib/firebase";
import { classifyCategory } from "../utils/classifyCategory";
import { extractCapacity, extractOutputPower } from "../utils/extractSpecs";

const BATCH = 400;

export async function backfillCategoryFromRakuten(): Promise<void> {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  // 全 monitoredItems を対象（既存にも category を入れる）
  while (true) {
    let q = db.collection("monitoredItems").orderBy("__name__").limit(BATCH);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();

    snap.docs.forEach((d) => {
      const data = d.data() as {
        productName?: string;
        itemCode?: string;
        imageUrl?: string | null;
        description?: string;
        capacity?: number | null;
        outputPower?: number | null;
        category?: string;
      };

      const name = data.productName ?? "";
      const desc = (data as any).description ?? ""; // descriptionが無い場合もある

      const capacity =
        typeof data.capacity === "number"
          ? data.capacity
          : extractCapacity(desc);
      const outputPower =
        typeof data.outputPower === "number"
          ? data.outputPower
          : extractOutputPower(desc);

      const category = classifyCategory({
        itemName: name,
        description: desc,
        capacity,
        outputPower,
      });

      batch.set(
        d.ref,
        { category, capacity, outputPower, updatedAt: new Date() },
        { merge: true },
      );
    });

    await batch.commit();
    lastDoc = snap.docs[snap.docs.length - 1];
  }
}
