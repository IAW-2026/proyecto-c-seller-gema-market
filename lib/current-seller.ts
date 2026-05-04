import { cache } from "react";
import { getDefaultSeller } from "@/lib/data/sellers";
import type { Seller } from "@/types/domain";

export const getCurrentSeller = cache(async (): Promise<Seller> => {
  return getDefaultSeller();
});
