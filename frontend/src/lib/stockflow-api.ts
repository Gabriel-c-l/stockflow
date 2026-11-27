import { apiRequest } from './api';
import type { Category, CreateCategoryInput, CreateProductInput, CreateStockMovementInput, Product, ProductListQuery, ProductListResponse, StockMovement, UpdateCategoryInput, UpdateProductInput, User, DashboardSummary, Supplier, CreateSupplierInput, UpdateSupplierInput, CreateUserInput, UpdateUserInput } from './types';

export const stockflowApi = {
  listUsers: async () => (await apiRequest<{ users: User[] }>('/users')).users,
  createUser: async (input: CreateUserInput) => (await apiRequest<{ user: User }>('/users', { method: 'POST', body: JSON.stringify(input) })).user,
  updateUser: async (id: string, input: UpdateUserInput) => (await apiRequest<{ user: User }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) })).user,
  deactivateUser: async (id: string) => (await apiRequest<{ user: User }>(`/users/${id}`, { method: 'DELETE' })).user,
  getDashboardSummary: () => apiRequest<DashboardSummary>("/dashboard/summary"),
  listSuppliers: (status: "active" | "inactive" | "all" = "active") => apiRequest<Supplier[]>(`/suppliers?status=${status}`),
  getSupplier: (id: string) => apiRequest<Supplier>(`/suppliers/${id}`),
  createSupplier: (input: CreateSupplierInput) => apiRequest<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(input) }),
  updateSupplier: (id: string, input: UpdateSupplierInput) => apiRequest<Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deactivateSupplier: (id: string) => apiRequest<Supplier>(`/suppliers/${id}`, { method: "DELETE" }),
  listCategories: (status: "active" | "inactive" | "all" = "active") => apiRequest<Category[]>(`/categories?status=${status}`),
  getCategory: (id: string) => apiRequest<Category>(`/categories/${id}`),
  createCategory: (input: CreateCategoryInput) => apiRequest<Category>("/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id: string, input: UpdateCategoryInput) => apiRequest<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deactivateCategory: (id: string) => apiRequest<Category>(`/categories/${id}`, { method: "DELETE" }),
  health: () => apiRequest<{ status: string; service: string; timestamp: string }>('/health'),
  login: (email: string, password: string) => apiRequest<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  currentUser: () => apiRequest<{ user: User }>('/auth/me'),
  updateLanguagePreference: (language: 'pt-BR' | 'en') => apiRequest<{ language: 'pt-BR' | 'en' }>('/auth/preferences', { method: 'PATCH', body: JSON.stringify({ language }) }),
  listProducts: (query: ProductListQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
    const suffix = params.size ? `?${params.toString()}` : '';
    return apiRequest<ProductListResponse>(`/products${suffix}`);
  },
  getProduct: (id: string) => apiRequest<Product>(`/products/${id}`),
  createProduct: (input: CreateProductInput) => apiRequest<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  updateProduct: (id: string, input: UpdateProductInput) => apiRequest<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deactivateProduct: (id: string) => apiRequest<Product>(`/products/${id}`, { method: 'DELETE' }),
  listStockMovements: () => apiRequest<StockMovement[]>('/stock-movements'),
  createStockMovement: (input: CreateStockMovementInput) => apiRequest<StockMovement>('/stock-movements', { method: 'POST', body: JSON.stringify(input) }),
  listProductMovements: (productId: string) => apiRequest<StockMovement[]>(`/products/${productId}/movements`),
};
