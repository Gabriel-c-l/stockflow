export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language?: 'pt-BR' | 'en';
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | string;
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

export interface Supplier {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput { name: string; taxId?: string; email?: string; phone?: string; address?: string; notes?: string; }
export interface UpdateSupplierInput { name?: string; taxId?: string | null; email?: string | null; phone?: string | null; address?: string | null; notes?: string | null; }

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
  supplierId?: string | null;
  supplier?: Pick<Supplier, 'id' | 'name' | 'taxId'> | null;
  recipient?: string | null;
  unitCost?: number | string | null;
  createdAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  price?: number;
  minStock?: number;
  categoryId?: string | null;
  unit?: ProductUnit;
  location?: string | null;
}

export interface CreateStockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  supplierId?: string | null;
  recipient?: string | null;
  unitCost?: number;
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
  price?: number;
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

export interface CreateUserInput { name: string; email: string; password: string; role: UserRole; }
export interface UpdateUserInput { name?: string; email?: string; role?: UserRole; isActive?: boolean; }
