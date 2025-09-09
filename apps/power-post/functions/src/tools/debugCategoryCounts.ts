// functions/src/tools/debugCategoryCounts.ts
/* eslint-disable no-console */
import { db } from "../lib/firebase";
(async () => {
  const snap = await db.collection("monitoredItems").get();
  const c: Record<string, number> = {};
  snap.forEach((d) => {
    const cat = (d.data() as { category?: string }).category ?? "(none)";
    c[cat] = (c[cat] ?? 0) + 1;
  });
  console.log(c);
  process.exit(0);
})();
