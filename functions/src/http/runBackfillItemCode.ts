// functions/src/http/runBackfillItemCode.ts
import * as functions from "firebase-functions";
import { backfillItemCode } from "../scripts/normalize/backfillItemCode";
export const runBackfillItemCode = functions.https.onRequest(
  async (_req, res) => {
    res.json(await backfillItemCode());
  },
);
