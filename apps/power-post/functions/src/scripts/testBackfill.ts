import { backfillMonitoredFields } from "./normalize/backfillMonitoredFields";

(async () => {
  await backfillMonitoredFields(50);
  process.exit(0);
})();
