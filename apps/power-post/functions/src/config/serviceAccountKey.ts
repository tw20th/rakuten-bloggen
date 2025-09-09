// ローカル開発用の serviceAccountKey 読み込み
export const getServiceAccountKey = (): string => {
  const rawKey = process.env.SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error(
      "❌ SERVICE_ACCOUNT_KEY が未設定です（ローカル環境変数を確認）",
    );
  }

  return rawKey;
};
