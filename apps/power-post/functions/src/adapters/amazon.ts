import { SourceAdapter, AdapterItem } from "./index";

export const amazonAdapter: SourceAdapter = {
  source: "amazon",
  async fetchNewItems(): Promise<AdapterItem[]> {
    // まだAPI未接続：空配列を返す（または検索リンクのみ）
    return [];
  },
};
