import { SourceAdapter, AdapterItem } from "./index";
import {
  getRakutenItemsFromFirestore,
  RakutenItemDoc,
} from "../services/rakutenRepo";

export const rakutenAdapter: SourceAdapter = {
  source: "rakuten",
  async fetchNewItems(): Promise<AdapterItem[]> {
    const docs: RakutenItemDoc[] = await getRakutenItemsFromFirestore();
    return docs.map(
      (d): AdapterItem => ({
        id: d.itemCode,
        productName: d.itemName ?? "",
        imageUrl: d.imageUrl ?? "",
        price: typeof d.itemPrice === "number" ? d.itemPrice : undefined,
        url: d.affiliateUrl ?? undefined,
        specs: {
          capacity: d.capacity ?? undefined,
          outputPower: d.outputPower ?? undefined,
          weight: d.weight ?? undefined,
          hasTypeC: d.hasTypeC ?? undefined,
        },
      }),
    );
  },
};
