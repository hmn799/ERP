export interface CategoryLookup {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;

  categoryId: string;

  category: CategoryLookup;
}

export interface CreateSubCategoryDto {
  name: string;

  categoryId: string;
}