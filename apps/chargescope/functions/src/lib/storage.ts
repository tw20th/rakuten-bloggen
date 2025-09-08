import { getStorage } from "firebase-admin/storage";
import { v4 as uuid } from "uuid";

// 必要なら .env や Secrets に STORAGE_BUCKET を入れて明示
const BUCKET = process.env.STORAGE_BUCKET || undefined;

export async function uploadBufferAsPublicImage(
  buf: Buffer,
  filepath: string,
  contentType = "image/png",
): Promise<string> {
  const bucket = getStorage().bucket(BUCKET); // 未指定ならデフォルトバケット
  const file = bucket.file(filepath);
  const token = uuid();

  await file.save(buf, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  // 期限極長の署名URL（Rules無視で読める）
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "2100-01-01",
  });
  return url;
}
