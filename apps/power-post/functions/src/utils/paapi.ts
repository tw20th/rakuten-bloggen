// 最小の PA-API クライアント型（今はモック）
export type PaapiItem = {
  ASIN: string;
  Title?: string;
  Brand?: string;
  DetailPageURL?: string;
  ImageURL?: string;
  Price?: number | null;
  Availability?: string | null;
  _raw?: unknown;
};

export type AmazonClient = {
  getItems: (asins: string[]) => Promise<PaapiItem[]>;
  searchItems: (q: string) => Promise<PaapiItem[]>;
};

export type PaapiOptions = {
  enabled?: boolean; // true にしたら実クライアントへ切替（後日）
};

// 今はモック。enabled=true にしたら実装差し込み予定。
export function createAmazonClient(opts: PaapiOptions = {}): AmazonClient {
  const enabled = opts.enabled ?? process.env.AMAZON_API_ENABLED === "true";
  if (!enabled) {
    return {
      async getItems() {
        return [];
      },
      async searchItems() {
        return [];
      },
    };
  }
  // 後日：ここに PA-API v5 の本実装を差し込み
  return {
    async getItems() {
      return [];
    },
    async searchItems() {
      return [];
    },
  };
}
