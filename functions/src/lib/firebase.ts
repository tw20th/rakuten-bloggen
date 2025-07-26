import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

// 初期化は一度だけ
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
