export type Language = 'en' | 'bn';

export type CategoryId =
  | 'smart-watches'
  | 'earbuds'
  | 'headphones'
  | 'smart-gadgets'
  | 'accessories';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface ProductSpec {
  labelEn: string;
  labelBn: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  category: CategoryId;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  featured: boolean;
  specs: ProductSpec[];
  warrantyEn: string;
  warrantyBn: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  sku: string;
  nameEn: string;
  nameBn: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  district: string;
  address: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'COD';
  status: OrderStatus;
  emailNotification: {
    configured: boolean;
    customerSent: boolean;
    adminSent: boolean;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
  createdAt: string;
}

export interface StoreSettings {
  brandName: string;
  taglineEn: string;
  taglineBn: string;
  logoUrl: string;
  announcementEn: string;
  announcementBn: string;
  heroTitleEn: string;
  heroTitleBn: string;
  heroSubtitleEn: string;
  heroSubtitleBn: string;
  heroCtaEn: string;
  heroCtaBn: string;
  heroImage: string;
  whatsappNumber: string;
  facebookPageUrl: string;
  contactEmail: string;
  storeAddressEn: string;
  storeAddressBn: string;
  dhakaDeliveryFee: number;
  outsideDhakaDeliveryFee: number;
  freeDeliveryThreshold: number;
}

export interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  user: {
    email: string;
    role: 'admin';
    name: string;
  } | null;
}

export interface EmailServiceStatus {
  configured: boolean;
  adminContactEmail: string;
  smtpHost: string | null;
}
