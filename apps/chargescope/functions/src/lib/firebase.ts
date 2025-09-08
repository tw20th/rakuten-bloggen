// functions/src/lib/firebase.ts 差し替え
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
  // undefined は無視（意図せず null になるのを防ぐ）
  admin.firestore().settings({ ignoreUndefinedProperties: true });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// 便利再エクスポート
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
