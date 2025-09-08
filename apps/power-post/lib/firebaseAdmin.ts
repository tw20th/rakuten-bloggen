// lib/firebaseAdmin.ts
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[env] Missing ${name}`);
  return v;
}

const serviceAccount = JSON.parse(
  Buffer.from(required("FIREBASE_SERVICE_ACCOUNT_KEY"), "base64").toString(
    "utf-8"
  )
);

const app = getApps().length
  ? getApp()
  : initializeApp({ credential: cert(serviceAccount) });
export const dbAdmin = getFirestore(app);
