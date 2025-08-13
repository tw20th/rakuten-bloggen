import { db } from "../lib/firebase";

export type RakutenItemDoc = {
  itemCode: string;
  itemName: string;
  imageUrl?: string;
  itemPrice?: number;
  affiliateUrl?: string;
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;
};

export async function getRakutenItemsFromFirestore(): Promise<
  RakutenItemDoc[]
> {
  const snap = await db.collection("rakutenItems").limit(500).get();
  return snap.docs.map((d) => d.data() as RakutenItemDoc);
}
