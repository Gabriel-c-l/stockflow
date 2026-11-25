import { apiRequest } from './api';
import type { CreateProductInput, CreateStockMovementInput, Product, StockMovement, User } from './types';

export const stockflowApi = {
  health: () => apiRequest<{ status: string; service: string; timestamp: string }>('/health'),
  login: (email: string, password: string) => apiRequest<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  currentUser: () => apiRequest<{ user: User }>('/auth/me'),
  listProducts: () => apiRequest<Product[]>('/products'),
  getProduct: (id: string) => apiRequest<Product>(`/products/${id}`),
  createProduct: (input: CreateProductInput) => apiRequest<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  createStockMovement: (input: CreateStockMovementInput) => apiRequest<StockMovement>('/stock-movements', { method: 'POST', body: JSON.stringify(input) }),
  listProductMovements: (productId: string) => apiRequest<StockMovement[]>(`/products/${productId}/movements`),
};
