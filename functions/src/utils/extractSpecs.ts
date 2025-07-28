// utils/extractSpecs.ts
export const extractCapacity = (text: string): number | null => {
  const match = text.match(/(\d{3,5})\s?mAh/i);
  return match ? parseInt(match[1], 10) : null;
};

export const extractOutputPower = (text: string): number | null => {
  const match = text.match(
    /最大\s?(\d{1,2}\.?\d{0,2})W|MAX\s?(\d{1,2}\.?\d{0,2})W/i,
  );
  const value = match?.[1] || match?.[2];
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
