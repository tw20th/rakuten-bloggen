export type Condition = {
  field: string;
  operator: "==" | "!=" | ">=" | ">" | "<=" | "<";
  value: string | number | boolean | null;
};

export type FilterRule = {
  label: string;
  conditions: Condition[];
  tags: string[];
};

export type ApplyFilterRulesInput = Record<
  string,
  string | number | boolean | null
>;

export type ApplyFilterRulesResult = {
  tags: string[];
  matchedRules: FilterRule[];
  category?: string; // ← 追加
};

const pass = (input: ApplyFilterRulesInput, rule: FilterRule): boolean => {
  return rule.conditions.every((c) => {
    const v = input[c.field];
    switch (c.operator) {
      case "==":
        return v === c.value;
      case "!=":
        return v !== c.value;
      case ">=":
        return (
          typeof v === "number" && typeof c.value === "number" && v >= c.value
        );
      case ">":
        return (
          typeof v === "number" && typeof c.value === "number" && v > c.value
        );
      case "<=":
        return (
          typeof v === "number" && typeof c.value === "number" && v <= c.value
        );
      case "<":
        return (
          typeof v === "number" && typeof c.value === "number" && v < c.value
        );
      default:
        return false;
    }
  });
};

export function applyFilterRules(
  input: ApplyFilterRulesInput,
  rules: FilterRule[],
): ApplyFilterRulesResult {
  const matched: FilterRule[] = [];
  const tagSet = new Set<string>();

  for (const r of rules) {
    if (pass(input, r)) {
      matched.push(r);
      r.tags.forEach((t) => tagSet.add(t));
    }
  }

  const category = matched[0]?.label; // 最初に当たったルール名を採用
  return { tags: Array.from(tagSet), matchedRules: matched, category };
}
