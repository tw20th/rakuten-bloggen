// utils/extractSpecs.ts
export const extractCapacity = (text: string): number | null => {
  const m = text.match(/([\d,]{3,7})\s?mAh/i);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ""), 10);
};

export const extractOutputPower = (text: string): number | null => {
  const match =
    text.match(/最大\s?(\d{1,3}(?:\.\d{1,2})?)\s?W/i) ||
    text.match(/MAX\s?(\d{1,3}(?:\.\d{1,2})?)\s?W/i) ||
    text.match(/(\d{2,3})\s?W(?!h)/i); // "65W PD" 等
  const value = match?.[1];
  return value ? parseFloat(value) : null;
};

export const extractWeight = (text: string): number | null => {
  const match = text.match(/約?\s?(\d{2,4})\s?g/i);
  return match ? parseInt(match[1], 10) : null;
};

export const checkTypeC = (text: string): boolean => {
  return /USB[-\s]?C|Type[-\s]?C/i.test(text);
};

export const extractShortTitle = (fullTitle: string): string => {
  return fullTitle.split("/")[0].split("（")[0].trim();
};
