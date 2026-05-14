import type { Category } from '@/types/domain';
import type { CategoryItem } from '@/lib/api/contracts/categories';

export function toCategoryItem(category: Category): CategoryItem {
  return {
    category_id: category.id,
    name: category.name,
  };
}
