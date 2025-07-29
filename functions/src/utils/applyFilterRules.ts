export type FilterCondition = {
  field: string;
  operator: ">=" | "<=" | "==";
  value: number | boolean;
};

export type FilterRule = {
  label: string;
  conditions: FilterCondition[];
  tags: string[];
};

type ItemSpec = {
  [key: string]: number | boolean | string | null;
};

// ⬇️ 戻り値の型を拡張
export const applyFilterRules = (
  item: ItemSpec,
  rules: FilterRule[],
): { tags: string[]; matchedRules: FilterRule[] } => {
  const matchedTags: string[] = [];
  const matchedRules: FilterRule[] = [];

  for (const rule of rules) {
    const isMatch = rule.conditions.every((cond) => {
      const fieldValue = item[cond.field];

      if (typeof fieldValue === "undefined" || fieldValue === null)
        return false;

      switch (cond.operator) {
        case "==":
          return fieldValue === cond.value;
        case ">=":
          return (
            typeof fieldValue === "number" &&
            fieldValue >= (cond.value as number)
          );
        case "<=":
          return (
            typeof fieldValue === "number" &&
            fieldValue <= (cond.value as number)
          );
        default:
          return false;
      }
    });

    if (isMatch) {
      matchedTags.push(...rule.tags);
      matchedRules.push(rule); // ⬅️ 追加
    }
  }

  return {
    tags: [...new Set(matchedTags)],
    matchedRules,
  };
};
