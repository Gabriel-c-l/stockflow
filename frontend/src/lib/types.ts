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
  quantity: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  description?: string;
  minStock?: number;
}

export interface CreateStockMovementInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  notes?: string;
}
