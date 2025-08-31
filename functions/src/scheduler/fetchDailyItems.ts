// functions/src/scheduler/fetchDailyItems.ts
import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic";

export const runFetchDailyItems = async () => {
  await getRakutenItemsAndSave();
};
