import type {
  AuthState,
  CustomerRecord,
  EmailServiceStatus,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  deliveredRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  statusCounts: Record<OrderStatus, number>;
  categoryRevenue: Record<string, number>;
}

export const api = {
  getStorefront: () =>
    request<{ products: Product[]; settings: StoreSettings }>('/api/storefront'),

  createOrder: (payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    district: string;
    address: string;
    note?: string;
    items: { productId: string; quantity: number }[];
  }) => request<{ order: Order }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),

  trackOrder: (orderNumber: string, phone: string) =>
    request<{ order: Order }>(
      `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
    ),

  getAuthStatus: () => request<AuthState>('/api/auth/status'),

  setupAdmin: (payload: { email: string; password: string; name?: string }) =>
    request<{ user: AuthState['user'] }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginAdmin: (payload: { email: string; password: string }) =>
    request<{ user: AuthState['user'] }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logoutAdmin: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  uploadImage: (filename: string, dataUrl: string) =>
    request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, dataUrl }),
    }),

  getOrders: () => request<{ orders: Order[] }>('/api/orders'),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getCustomers: () => request<{ customers: CustomerRecord[] }>('/api/customers'),

  getAnalytics: () => request<AnalyticsSummary>('/api/analytics'),

  updateSettings: (settings: Partial<StoreSettings>) =>
    request<{ settings: StoreSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getEmailStatus: () => request<EmailServiceStatus>('/api/email/status'),
};
