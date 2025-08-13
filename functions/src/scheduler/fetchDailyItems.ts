// functions/src/scheduler/fetchDailyItems.ts

import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic";

// ✅ Cloud Functions に登録せず、ロジック関数として定義
export const runFetchDailyItems = async () => {
  await getRakutenItemsAndSave();
};
