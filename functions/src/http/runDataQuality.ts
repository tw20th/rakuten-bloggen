import * as functions from "firebase-functions";
import { runDataQualitySweep } from "../scripts/audit/runDataQualitySweep";

export const runDataQuality = functions.https.onRequest(async (_req, res) => {
  const result = await runDataQualitySweep();
  res.json(result);
});
