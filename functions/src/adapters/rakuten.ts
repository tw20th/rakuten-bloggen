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
      (d: RakutenItemDoc): AdapterItem => ({
        id: d.itemCode,
        productName: d.itemName,
        imageUrl: d.imageUrl,
        price: d.itemPrice,
        url: d.affiliateUrl,
        specs: {
          capacity: d.capacity,
          outputPower: d.outputPower,
          weight: d.weight,
          hasTypeC: d.hasTypeC,
        },
      }),
    );
  },
};
