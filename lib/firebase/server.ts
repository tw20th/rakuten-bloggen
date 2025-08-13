// lib/firebase/server.ts

import admin from "firebase-admin";

// すでに初期化済みか確認
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // 環境変数 GOOGLE_APPLICATION_CREDENTIALS を使用
  });
}

// Firestore をエクスポート
export const db = admin.firestore();
