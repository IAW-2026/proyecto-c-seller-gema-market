// Mappers domain → contract HTTP para el ABM admin de categorías.

import type { Category } from '@/types/domain';
import type { CategoryWithCount } from '@/lib/data/admin/categories';
import type {
  AdminCategoryItem,
  AdminCategoryMutationResponse,
} from '@/lib/api/contracts/admin/categories';

export function toAdminCategoryItem(
  category: CategoryWithCount,
): AdminCategoryItem {
  return {
    category_id: category.id,
    name: category.name,
    product_count: category.productsCount,
  };
}

export function toAdminCategoryMutationResponse(
  category: Category,
): AdminCategoryMutationResponse {
  return {
    category_id: category.id,
    name: category.name,
  };
}
