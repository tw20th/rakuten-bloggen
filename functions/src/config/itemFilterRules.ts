import type { FilterRule } from "../utils/applyFilterRules";

export const itemFilterRules: FilterRule[] = [
  {
    label: "大容量モデル",
    conditions: [{ field: "capacity", operator: ">=", value: 20000 }],
    tags: ["大容量", "長時間"],
  },
  {
    label: "軽量モデル",
    conditions: [{ field: "weight", operator: "<=", value: 150 }],
    tags: ["軽量", "持ち運びやすい"],
  },
  {
    label: "急速充電対応",
    conditions: [{ field: "outputPower", operator: ">=", value: 18 }],
    tags: ["急速充電"],
  },
  {
    label: "Type-C対応",
    conditions: [{ field: "hasTypeC", operator: "==", value: true }],
    tags: ["Type-C対応"],
  },
];
