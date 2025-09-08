// functions/src/utils/validators.ts
import { z } from "zod";

export const PriceHistoryEntrySchema = z.object({
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO想定")),
  price: z.number().nonnegative(),
});

const UrlOrEmpty = z.string().url().or(z.literal("")); // ← ここを使い回し

export const MonitoredItemSchema = z.object({
  productName: z.string().min(1),
  imageUrl: UrlOrEmpty, // ← 空文字OKに
  price: z.number().nonnegative(),
  capacity: z.number().nullable(),
  outputPower: z.number().nullable(),
  weight: z.number().nullable(),
  hasTypeC: z.boolean(),
  tags: z.array(z.string()),
  category: z.string(),
  featureHighlights: z.array(z.string()),
  aiSummary: z.string(),
  priceHistory: z.array(PriceHistoryEntrySchema),
  affiliateUrl: UrlOrEmpty, // ← 空文字OKに
  views: z.number().int().nonnegative(),
  createdAt: z.any(), // Firestore Timestamp / Date 許容
  updatedAt: z.any(),
  inStock: z.boolean().nullable(),
  reviewAverage: z.number().nullable(),
  reviewCount: z.number().int().nullable(),
});

export const CatalogItemSchema = z.object({
  id: z.string(),
  productName: z.string().min(1),
  brand: z.string().optional(),
  imageUrl: UrlOrEmpty.optional(), // ← 同様に緩めると安全
  category: z.string().optional(),
  specs: z
    .object({
      capacity: z.number().optional(),
      outputPower: z.number().optional(),
      weight: z.number().optional(),
      hasTypeC: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
  featureHighlights: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  aiSummary: z.string().optional(),
  affiliate: z
    .object({
      rakutenUrl: UrlOrEmpty.optional(),
      amazonUrl: UrlOrEmpty.optional(),
      yahooUrl: UrlOrEmpty.optional(),
    })
    .optional(),
  priceHistory: z.array(
    z.object({
      source: z.enum(["rakuten", "amazon", "yahoo"]),
      price: z.number().nonnegative(),
      date: z.string(),
      url: UrlOrEmpty.optional(),
    }),
  ),
  scores: z
    .object({
      popularity: z.number().optional(),
      marginPotential: z.number().optional(),
      seoPotential: z.number().optional(),
    })
    .optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});
