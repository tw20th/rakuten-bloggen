import {
  collection,
  query,
  where,
  orderBy,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export const buildProductQuery = (params: {
  hasTypeC?: boolean;
  minCapacity?: number;
  minOutput?: number;
  tag?: string;
  sortBy?: "createdAt" | "price" | "capacity";
  sortOrder?: "asc" | "desc";
}) => {
  const constraints: QueryConstraint[] = [];

  if (params.hasTypeC) {
    constraints.push(where("hasTypeC", "==", true));
  }
  if (params.minCapacity) {
    constraints.push(where("capacity", ">=", params.minCapacity));
  }
  if (params.minOutput) {
    constraints.push(where("outputPower", ">=", params.minOutput));
  }
  if (params.tag) {
    constraints.push(where("tags", "array-contains", params.tag));
  }

  if (params.sortBy) {
    constraints.push(orderBy(params.sortBy, params.sortOrder || "desc"));
  }

  return query(collection(db, "monitoredItems"), ...constraints);
};
