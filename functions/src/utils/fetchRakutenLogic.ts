import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";
import {
  RAKUTEN_APPLICATION_ID,
  RAKUTEN_AFFILIATE_ID,
} from "../config/secrets";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getRakutenItemsAndSave(opts?: {
  keyword?: string;
  maxPages?: number;
  perPage?: number;
}) {
  const applicationId = RAKUTEN_APPLICATION_ID.value();
  const affiliateId = RAKUTEN_AFFILIATE_ID.value();
  if (!applicationId || !affiliateId) {
    throw new Error("❌ 楽天APIキーまたはアフィリエイトIDが未設定です");
  }

  const keyword = opts?.keyword ?? "モバイルバッテリー";
  const perPage = Math.max(1, Math.min(opts?.perPage ?? 30, 30));
  const maxPages = Math.max(1, Math.min(opts?.maxPages ?? 10, 100));

  let savedCount = 0;
  let page = 1;

  const baseParams = new URLSearchParams({
    format: "json",
    formatVersion: "2",
    applicationId,
    affiliateId,
    keyword,
    hits: String(perPage),
    sort: "-updateTimestamp",
    elements: [
      "itemCode",
      "itemName",
      "itemPrice",
      "affiliateUrl",
      "itemCaption",
      "mediumImageUrls",
      "reviewAverage",
      "reviewCount",
      "updateTimestamp",
    ].join(","),
  });

  while (page <= maxPages) {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));

    const apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params.toString()}`;
    logger.info("🔍 楽天API URL:", { page, apiUrl });

    let resp;
    try {
      resp = await fetch(apiUrl);
    } catch (e) {
      logger.warn("ネットワークエラー。1秒後に再試行", { page, e });
      await sleep(1000);
      continue;
    }

    if (resp.status === 429) {
      logger.warn("429 Too Many Requests。バックオフして再試行", { page });
      await sleep(1500 * page);
      continue;
    }

    if (!resp.ok) {
      logger.warn("楽天APIエラー、次ページへスキップ", {
        status: resp.status,
        text: await resp.text(),
      });
      await sleep(1000);
      page++;
      continue;
    }

    const data = await resp.json();
    const items = Array.isArray(data.Items) ? data.Items : data.items;
    if (!items || items.length === 0) {
      logger.info("該当なし。打ち切り", { page });
      break;
    }

    for (const item of items) {
      const it = item.item ?? item;
      const itemCode = it.itemCode ?? "";
      if (!itemCode) continue;

      const docRef = db.collection("rakutenItems").doc(itemCode);
      const existing = await docRef.get();
      if (existing.exists) {
        const cur = existing.data() ?? {};
        const next: any = {};
        if ((cur.reviewAverage ?? null) == null && it.reviewAverage != null)
          next.reviewAverage = Number(it.reviewAverage);
        if ((cur.reviewCount ?? null) == null && it.reviewCount != null)
          next.reviewCount = Number(it.reviewCount);
        if (!cur.imageUrl) {
          const url =
            it.mediumImageUrls?.[0]?.imageUrl ?? it.mediumImageUrls?.[0] ?? "";
          if (url) next.imageUrl = url;
        }
        if (Object.keys(next).length) {
          await docRef.set(next, { merge: true });
        }
        continue;
      }

      const docData = {
        itemCode,
        itemName: it.itemName ?? "",
        itemPrice: it.itemPrice ?? 0,
        affiliateUrl: it.affiliateUrl ?? "",
        imageUrl:
          it.mediumImageUrls?.[0]?.imageUrl ?? it.mediumImageUrls?.[0] ?? "",
        description: it.itemCaption ?? "",
        reviewAverage:
          it.reviewAverage != null ? Number(it.reviewAverage) : null,
        reviewCount: it.reviewCount != null ? Number(it.reviewCount) : null,
        createdAt: new Date(),
      };

      await docRef.set(docData);
      savedCount++;
    }

    await sleep(1000);
    page++;

    const totalPages = data.pageCount ?? data.PageCount;
    if (typeof totalPages === "number" && page > totalPages) break;
  }

  logger.info(`✅ 保存完了：新規 ${savedCount} 件`);
  return savedCount;
}
