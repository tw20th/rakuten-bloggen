// scripts/migrateMonitoredItemsIds.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, DocumentReference } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === "1"; // 確認だけしたいときは DRY_RUN=1 で実行

// ---- Firebase Admin 初期化（あなたの lib/firebase.ts と同じ方式） ----
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!, "base64").toString(
    "utf8"
  )
);

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// ---- utils ----
const toSafeId = (id: string) => id.replace(/:/g, "-");

// サブコレクションも含めてコピーする（再帰）
async function copyDocWithSubcollections(
  fromRef: DocumentReference,
  toRef: DocumentReference
) {
  const snap = await fromRef.get();
  if (!snap.exists) return;

  const data = snap.data()!;
  if (!DRY_RUN) {
    await toRef.set(data, { merge: true });
  }

  const subCols = await fromRef.listCollections();
  for (const col of subCols) {
    const subSnap = await col.get();
    for (const d of subSnap.docs) {
      const targetRef = toRef.collection(col.id).doc(d.id); // subdoc の id はそのまま
      if (!DRY_RUN) {
        await copyDocWithSubcollections(d.ref, targetRef);
      }
    }
  }
}

async function migrateAll() {
  const col = db.collection("monitoredItems");
  const snap = await col.get();

  console.log(`🔎 found ${snap.size} docs in monitoredItems`);
  let migrated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const oldId = doc.id;
    if (!oldId.includes(":")) {
      skipped++;
      continue;
    }

    const newId = toSafeId(oldId);
    const oldRef = doc.ref;
    const newRef = col.doc(newId);

    console.log(`\n➡️  ${oldId}  ->  ${newId}`);

    const newExists = (await newRef.get()).exists;
    if (newExists) {
      console.log(`   ⚠️  skip: ${newId} already exists`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log("   [DRY_RUN] copy & delete skipped");
      migrated++;
      continue;
    }

    await copyDocWithSubcollections(oldRef, newRef);
    await oldRef.delete();

    console.log("   ✅ migrated & deleted old doc");
    migrated++;
  }

  console.log("\n==== DONE ====");
  console.log(`migrated: ${migrated}`);
  console.log(`skipped : ${skipped}`);
}

migrateAll()
  .then(() => {
    console.log("🎉 migration finished");
    process.exit(0);
  })
  .catch((e) => {
    console.error("💥 migration failed", e);
    process.exit(1);
  });
