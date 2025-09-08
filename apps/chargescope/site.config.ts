export type CategoryKey =
  | "battery"
  | "chair"
  | "camera"
  | "smartlock"
  | "audio"
  | "mattress";

export const siteConfig = {
  siteName: "ChargeScope",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  defaultCategory: "battery" as CategoryKey,
  revalidateEndpoint: "/api/revalidate",
  revalidateSecretEnvKey: "REVALIDATE_SECRET",
};
