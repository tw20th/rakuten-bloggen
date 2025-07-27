import { onSchedule } from "firebase-functions/v2/scheduler";
import { getRakutenItemsAndSave } from "../utils/fetchRakutenLogic";
import { RAKUTEN_APPLICATION_ID } from "../config/secrets";

export const fetchDailyItems = onSchedule(
  {
    schedule: "every day 06:00",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    secrets: [RAKUTEN_APPLICATION_ID],
  },
  async () => {
    await getRakutenItemsAndSave();
  },
);
