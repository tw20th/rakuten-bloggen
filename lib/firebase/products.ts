// lib/firebase/products.ts
import { db } from "@/lib/firebase"; // Firebase Admin SDKの初期化済みdb
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { MonitoredItem } from "@/types";

export const getAllMonitoredItems = async (): Promise<MonitoredItem[]> => {
  const snapshot = await getDocs(collection(db, "monitoredItems"));
  return snapshot.docs.map((doc) => doc.data() as MonitoredItem);
};

export const getMonitoredItemById = async (
  itemId: string
): Promise<MonitoredItem | null> => {
  const ref = doc(db, "monitoredItems", itemId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data() as MonitoredItem;
};
