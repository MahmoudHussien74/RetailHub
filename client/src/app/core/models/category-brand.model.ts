// ── Category Models ──

export interface CategoryDto {
  id: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
}

export interface CreateCategoryDto {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface UpdateCategoryDto extends CreateCategoryDto {}

// ── Brand Models ──

export interface BrandDto {
  id: string;
  nameAr: string;
  nameEn?: string;
}

export interface CreateBrandDto {
  nameAr: string;
  nameEn?: string;
}

export interface UpdateBrandDto extends CreateBrandDto {}
