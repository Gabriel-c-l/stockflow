export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: Category | null;
  unit: ProductUnit;
  location: string | null;
  quantity: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductUnit = 'UN' | 'CX' | 'PCT' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput { name: string; description?: string | null; }
export interface UpdateCategoryInput { name?: string; description?: string | null; }

export type StockMovementType = 'ENTRY' | 'EXIT';

export interface StockMovement {
  id: string;
  productId: string;
  performedById: string | null;
  type: StockMovementType;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  minStock?: number;
  categoryId?: string | null;
  unit?: ProductUnit;
  location?: string | null;
}

export interface CreateStockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  notes?: string;
}

export interface ProductListQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  pageSize?: number;
  categoryId?: string;
}

export interface ProductListResponse {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string | null;
  minStock?: number;
  categoryId?: string | null;
  unit?: ProductUnit;
  location?: string | null;
}


export interface DashboardSummary {
  totalProducts: number;
  totalUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  movementSummary: { entries: number; exits: number; entryQuantity: number; exitQuantity: number };
  movementSeries: Array<{ date: string; entries: number; exits: number }>;
  categoryBreakdown: Array<{ id: string; name: string; productCount: number }>;
  uncategorizedProducts: number;
  recentMovements: Array<StockMovement & {
    product: Pick<Product, 'id' | 'sku' | 'name' | 'unit'>;
    performedBy: { id: string; name: string } | null;
  }>;
  periodStart: string;
}
