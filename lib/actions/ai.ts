"use server";

import { requireSeller } from "@/lib/auth/current-seller";
import { getCategories } from "@/lib/data/categories";
import {
  generateProductDraft,
  type ProductDraft,
} from "@/lib/ai/product-draft";

export type GenerateProductDraftActionInput = {
  title: string;
  imageUrls: ReadonlyArray<string>;
};

export async function generateProductDraftAction(
  input: GenerateProductDraftActionInput,
): Promise<ProductDraft> {
  await requireSeller();
  const categories = await getCategories();
  return generateProductDraft({
    title: input.title,
    imageUrls: input.imageUrls,
    categories,
  });
}
