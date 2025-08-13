export type AdapterItem = {
  id: string;
  productName: string;
  imageUrl?: string;
  price?: number;
  url?: string;
  specs?: Record<string, unknown>;
};

export interface SourceAdapter {
  source: "rakuten" | "amazon" | "yahoo";
  fetchNewItems: () => Promise<AdapterItem[]>;
}
