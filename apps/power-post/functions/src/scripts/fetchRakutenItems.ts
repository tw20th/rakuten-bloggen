// functions/src/scripts/fetchRakutenItems.ts
import * as functions from "firebase-functions";
import { Request, Response } from "express";
import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic";

const fetchRakutenItemsHandler = async (_req: Request, res: Response) => {
  try {
    const count = await getRakutenItemsAndSave();
    res.status(200).send("Saved count: " + count);
  } catch (error) {
    functions.logger.error("❌ 処理中エラー", error as Error);
    res.status(500).send("Error fetching from Rakuten API");
  }
};

export { fetchRakutenItemsHandler };

export const fetchRakutenItems = functions
  .region("asia-northeast1")
  .https.onRequest(fetchRakutenItemsHandler);
