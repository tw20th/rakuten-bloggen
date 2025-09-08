export type IssueType =
  | "missing"
  | "null"
  | "empty"
  | "invalid"
  | "notFound"
  | "fixed";

export type QualityIssue = {
  collection: "monitoredItems" | "blogs";
  docId: string;
  field: string;
  type: IssueType;
  note?: string;
};

export type DataQualityStamp = {
  score: number; // 0-100
  flags: string[]; // "missing.aiSummary" など
  lastCheckedAt: FirebaseFirestore.Timestamp;
  autoFixed?: string[]; // 今回直したフィールド
};
