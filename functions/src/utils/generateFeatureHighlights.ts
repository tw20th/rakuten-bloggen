export type FeatureInput = {
  capacity?: number | null; // ← nullを許容
  outputPower?: number | null;
  weight?: number | null;
  hasTypeC?: boolean;
};

export function generateFeatureHighlights({
  capacity,
  outputPower,
  weight,
  hasTypeC,
}: FeatureInput): string[] {
  const highlights: string[] = [];

  if (capacity) {
    highlights.push(`大容量の${capacity}mAh`);
  }

  if (outputPower) {
    highlights.push(`最大${outputPower}W出力`);
  }

  if (weight) {
    highlights.push(`${weight}gの軽量設計`);
  }

  if (hasTypeC) {
    highlights.push(`Type-C対応`);
  }

  return highlights;
}
