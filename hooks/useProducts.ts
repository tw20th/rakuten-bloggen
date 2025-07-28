import { useEffect, useState } from "react";
import { getDocs, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebaseClient"; // 👈 Client SDK に切り替え
import { MonitoredItem } from "@/types/monitoredItem";

export const useProducts = () => {
  const [products, setProducts] = useState<MonitoredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, "monitoredItems"),
          orderBy("updatedAt", "desc")
        );
        const snapshot = await getDocs(q);
        const items: MonitoredItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            productName: data.productName,
            imageUrl: data.imageUrl,
            price: data.price,
            capacity: data.capacity,
            outputPower: data.outputPower,
            weight: data.weight,
            hasTypeC: data.hasTypeC,
            tags: data.tags || [],
            featureHighlights: data.featureHighlights || [],
            aiSummary: data.aiSummary || "",
            priceHistory: data.priceHistory || [],
            affiliateUrl: data.affiliateUrl,
            createdAt: data.createdAt?.toMillis() ?? null,
            updatedAt: data.updatedAt?.toMillis() ?? null,
          };
        });
        setProducts(items);
      } catch (err) {
        console.error("Failed to fetch monitoredItems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { products, loading };
};
