import {
  BarChart3,
  CheckCircle2,
  Eye,
  FileCode2,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { CATEGORY_LABELS, ORDER_STATUS_LABELS, formatBDT } from '../i18n/translations';
import { api, type AnalyticsSummary } from '../lib/api';
import type {
  AuthState,
  CategoryId,
  CustomerRecord,
  EmailServiceStatus,
  Language,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from '../types';
import { SafeImage } from './SafeImage';

interface AdminDashboardProps {
  lang: Language;
  products: Product[];
  settings: StoreSettings;
  onRefreshStorefront: () => Promise<void>;
  onToast: (type: 'success' | 'error', text: string) => void;
}

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'content' | 'guide';

const ALL_CATEGORIES: CategoryId[] = [
  'smart-watches',
  'earbuds',
  'headphones',
  'smart-gadgets',
  'accessories',
];

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function AdminDashboard({
  lang,
  products,
  settings,
  onRefreshStorefront,
  onToast,
}: AdminDashboardProps) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState(settings.contactEmail || 'jamaluddinmishu@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('Jamal Uddin Mishu');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailServiceStatus | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Product editor state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | CategoryId>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: '',
    category: 'smart-watches' as CategoryId,
    nameEn: '',
    nameBn: '',
    descriptionEn: '',
    descriptionBn: '',
    price: 0,
    originalPrice: 0,
    stock: 10,
    image: '',
    featured: true,
    warrantyEn: '6 Months Official Warranty',
    warrantyBn: '৬ মাসের অফিসিয়াল ওয়ারেন্টি',
  });
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Order filters & detail modal
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');

  // CMS Settings editor state
  const [cmsForm, setCmsForm] = useState<StoreSettings>(settings);
  const [savingCms, setSavingCms] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    setCmsForm(settings);
  }, [settings]);

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ordRes, custRes, anaRes, mailRes] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getAnalytics(),
        api.getEmailStatus(),
      ]);
      setOrders(ordRes.orders);
      setCustomers(custRes.customers);
      setAnalytics(anaRes);
      setEmailStatus(mailRes);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoadingData(false);
    }
  }, [onToast]);

  useEffect(() => {
    let active = true;
    api
      .getAuthStatus()
      .then((res) => {
        if (!active) return;
        setAuth(res);
        if (res.authenticated) {
          loadAdminData();
        }
      })
      .catch(() => {
        if (active) setAuth({ initialized: true, authenticated: false, user: null });
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAdminData]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (auth && !auth.initialized) {
        const res = await api.setupAdmin({
          email: authEmail.trim(),
          password: authPassword,
          name: authName.trim(),
        });
        setAuth({ initialized: true, authenticated: true, user: res.user });
        onToast('success', 'Administrator account initialized and signed in.');
      } else {
        const res = await api.loginAdmin({
          email: authEmail.trim(),
          password: authPassword,
        });
        setAuth({ initialized: true, authenticated: true, user: res.user });
        onToast('success', 'Signed in to Admin Dashboard.');
      }
      setAuthPassword('');
      await loadAdminData();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await api.logoutAdmin();
    setAuth({ initialized: true, authenticated: false, user: null });
    onToast('success', 'Signed out.');
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      sku: `TRN-${Date.now().toString().slice(-5)}`,
      category: 'smart-watches',
      nameEn: '',
      nameBn: '',
      descriptionEn: '',
      descriptionBn: '',
      price: 2990,
      originalPrice: 3490,
      stock: 15,
      image: '/src/assets/images/product_watch_apex_1794580120347.jpg',
      featured: false,
      warrantyEn: '6 Months Official Warranty',
      warrantyBn: '৬ মাসের অফিসিয়াল ওয়ারেন্টি',
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      category: product.category,
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      descriptionEn: product.descriptionEn,
      descriptionBn: product.descriptionBn,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      image: product.image,
      featured: product.featured,
      warrantyEn: product.warrantyEn,
      warrantyBn: product.warrantyBn,
    });
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProductImg(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await api.uploadImage(file.name, dataUrl);
      setProductForm((prev) => ({ ...prev, image: url }));
      onToast('success', 'Product image uploaded.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
        onToast('success', 'Product updated successfully.');
      } else {
        await api.createProduct(productForm);
        onToast('success', 'New product added to catalog.');
      }
      setIsProductModalOpen(false);
      await Promise.all([onRefreshStorefront(), loadAdminData()]);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await api.deleteProduct(product.id);
      onToast('success', `Deleted ${product.nameEn}.`);
      await Promise.all([onRefreshStorefront(), loadAdminData()]);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const { order } = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(order);
      }
      onToast('success', `Order ${order.orderNumber} updated to ${status}.`);
      await Promise.all([onRefreshStorefront(), loadAdminData()]);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to update order status.');
    }
  };

  const handleCmsImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'heroImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'logoUrl') setUploadingLogo(true);
    else setUploadingHero(true);

    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await api.uploadImage(file.name, dataUrl);
      setCmsForm((prev) => ({ ...prev, [field]: url }));
      onToast('success', 'Asset uploaded. Click Save Content Changes to publish.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingLogo(false);
      setUploadingHero(false);
    }
  };

  const handleSaveCms = async (e: FormEvent) => {
    e.preventDefault();
    setSavingCms(true);
    try {
      await api.updateSettings(cmsForm);
      await onRefreshStorefront();
      onToast('success', 'Storefront banner & content saved.');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to save storefront settings.');
    } finally {
      setSavingCms(false);
    }
  };

  // Loading auth
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
        <p className="text-sm">Verifying administrator session...</p>
      </div>
    );
  }

  // Auth Gate
  if (!auth?.authenticated) {
    const needsSetup = auth && !auth.initialized;
    return (
      <section className="max-w-md mx-auto px-4 py-14 sm:py-20">
        <div className="p-6 sm:p-8 rounded-xl bg-[#091124] border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#0D1A38] border border-cyan-500/30">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">
                {needsSetup ? 'Initialize Store Admin' : 'Admin Dashboard Login'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {needsSetup
                  ? 'Set your private administrator password for TRONIFY SHOP.'
                  : 'Authorized administrator access only.'}
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {needsSetup && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrator Name
                </label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050814] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050814] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password {needsSetup ? '(Minimum 8 characters)' : ''}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050814] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{needsSetup ? 'Create Admin Account & Enter' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </section>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const q = productSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameBn.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.district.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.district.toLowerCase().includes(q)
    );
  });

  const maxCategoryRev = analytics
    ? Math.max(1, ...Object.values(analytics.categoryRevenue))
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <p className="text-xs text-slate-400">
            Admin Console · {auth.user?.email} ({auth.user?.role})
          </p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5">
            TRONIFY SHOP Operations
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {[
            { id: 'overview', label: 'Sales & Analytics', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'content', label: 'Banner & Content', icon: LayoutTemplate },
            { id: 'guide', label: 'Firebase & Launch', icon: FileCode2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Workspace */}
        <main className="lg:col-span-9 min-w-0">
          {loadingData && !analytics ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading workspace metrics...
            </div>
          ) : null}

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-8">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80">
                  <p className="text-xs text-slate-400">Active Gross Sales</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-1.5">
                    {formatBDT(analytics.totalRevenue)}
                  </p>
                  <p className="font-mono tabular-nums text-xs text-cyan-400 mt-1">
                    Delivered: {formatBDT(analytics.deliveredRevenue)}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80">
                  <p className="text-xs text-slate-400">Total Orders</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-1.5">
                    {analytics.totalOrders}
                  </p>
                  <p className="font-mono tabular-nums text-xs text-amber-400 mt-1">
                    Pending Review: {analytics.pendingOrders}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80">
                  <p className="text-xs text-slate-400">Registered Customers</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-1.5">
                    {analytics.totalCustomers}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Unique mobile profiles</p>
                </div>

                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80">
                  <p className="text-xs text-slate-400">Catalog SKUs</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-1.5">
                    {analytics.totalProducts}
                  </p>
                  <p
                    className={`font-mono tabular-nums text-xs mt-1 ${
                      analytics.lowStockProducts > 0 ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    Low Stock (&le;5): {analytics.lowStockProducts}
                  </p>
                </div>
              </div>

              {/* Category Revenue & Order Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80 space-y-4">
                  <h2 className="font-display text-base font-semibold text-white">
                    Revenue by Category
                  </h2>
                  <div className="space-y-3">
                    {ALL_CATEGORIES.map((cat) => {
                      const val = analytics.categoryRevenue[cat] || 0;
                      const pct = Math.round((val / maxCategoryRev) * 100);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300">{CATEGORY_LABELS[cat].en}</span>
                            <span className="font-mono tabular-nums text-white">
                              {formatBDT(val)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full transition-all"
                              style={{ width: `${Math.max(val > 0 ? 4 : 0, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80 space-y-4">
                  <h2 className="font-display text-base font-semibold text-white">
                    Order Status Breakdown
                  </h2>
                  <div className="divide-y divide-slate-800/70">
                    {ALL_ORDER_STATUSES.map((status) => (
                      <div
                        key={status}
                        className="py-2.5 flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-300">{status}</span>
                        <span className="font-mono tabular-nums font-semibold text-white">
                          {analytics.statusCounts[status] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="rounded-xl bg-[#091124] border border-slate-800/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-white">
                    Recent Orders
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Manage All Orders →
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400">
                    No customer orders placed yet. Place a test COD order from the storefront to see live analytics.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3 font-medium">Order ID</th>
                          <th className="px-5 py-3 font-medium">Customer</th>
                          <th className="px-5 py-3 font-medium">District</th>
                          <th className="px-5 py-3 font-medium text-right">Total</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/30">
                            <td className="px-5 py-3 font-mono tabular-nums text-xs text-cyan-300">
                              {ord.orderNumber}
                            </td>
                            <td className="px-5 py-3 text-slate-200">{ord.customerName}</td>
                            <td className="px-5 py-3 text-slate-400">{ord.district}</td>
                            <td className="px-5 py-3 font-mono tabular-nums text-right text-white">
                              {formatBDT(ord.total)}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-300">{ord.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search SKU or name..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#091124] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) =>
                      setProductCategoryFilter(e.target.value as 'all' | CategoryId)
                    }
                    className="px-3 py-2 rounded-lg bg-[#091124] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Categories</option>
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c].en}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="rounded-xl bg-[#091124] border border-slate-800/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">SKU</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Price</th>
                        <th className="px-4 py-3 font-medium text-right">Stock</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-800/25">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-9 rounded overflow-hidden bg-[#050814] border border-slate-800 shrink-0">
                                <SafeImage
                                  src={product.image}
                                  alt={product.nameEn}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate max-w-[220px]">
                                  {product.nameEn}
                                </p>
                                <p className="text-xs text-slate-400 truncate max-w-[220px]">
                                  {product.nameBn}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">
                            {product.sku}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs">
                            {CATEGORY_LABELS[product.category].en}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-right text-white">
                            {formatBDT(product.price)}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono tabular-nums text-right ${
                              product.stock <= 5 ? 'text-amber-400' : 'text-cyan-400'
                            }`}
                          >
                            {product.stock}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditProductModal(product)}
                                aria-label={`Edit ${product.nameEn}`}
                                className="p-1.5 rounded border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product)}
                                aria-label={`Delete ${product.nameEn}`}
                                className="p-1.5 rounded border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, customer name, phone, or district..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#091124] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) =>
                    setOrderStatusFilter(e.target.value as 'all' | OrderStatus)
                  }
                  className="px-3 py-2 rounded-lg bg-[#091124] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">All Statuses</option>
                  {ALL_ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s][lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-[#091124] border border-slate-800/80 overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-400">
                    No matching orders found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-medium">Order ID</th>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">District</th>
                          <th className="px-4 py-3 font-medium text-right">COD Total</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-800/25">
                            <td className="px-4 py-3">
                              <p className="font-mono tabular-nums text-xs text-cyan-300 font-semibold">
                                {order.orderNumber}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-100 font-medium">{order.customerName}</p>
                              <p className="font-mono text-xs text-slate-400">
                                {order.customerPhone}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">{order.district}</td>
                            <td className="px-4 py-3 font-mono tabular-nums text-right text-white">
                              {formatBDT(order.total)}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    e.target.value as OrderStatus
                                  )
                                }
                                className="px-2.5 py-1.5 rounded bg-[#050814] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                              >
                                {ALL_ORDER_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER DATABASE */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer name, phone, or district..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#091124] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="rounded-xl bg-[#091124] border border-slate-800/80 overflow-hidden">
                {filteredCustomers.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-400">
                    Customer profiles are recorded automatically as orders are placed.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Mobile</th>
                          <th className="px-4 py-3 font-medium">District</th>
                          <th className="px-4 py-3 font-medium text-right">Orders</th>
                          <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-800/25">
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{c.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[220px]">
                                {c.address}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-300">
                              {c.phone}
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-xs">{c.district}</td>
                            <td className="px-4 py-3 font-mono tabular-nums text-right text-slate-200">
                              {c.totalOrders}
                            </td>
                            <td className="px-4 py-3 font-mono tabular-nums text-right text-cyan-400 font-semibold">
                              {formatBDT(c.totalSpent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BANNER, LOGO & CONTENT EDITOR */}
          {activeTab === 'content' && (
            <form onSubmit={handleSaveCms} className="space-y-6">
              {/* Email service real status indicator */}
              {emailStatus && (
                <div className="p-4 rounded-xl bg-[#091124] border border-slate-800 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-white">
                      Email Notification Integration:{' '}
                      {emailStatus.configured ? 'Active (SMTP Configured)' : 'Not Configured'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {emailStatus.configured
                        ? `Connected via ${emailStatus.smtpHost}. Order confirmations are emailed to customers and ${emailStatus.adminContactEmail}.`
                        : `Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables to enable automated order confirmation emails to customers and ${emailStatus.adminContactEmail}.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Brand Logo & Hero Banner Upload */}
              <div className="p-6 rounded-xl bg-[#091124] border border-slate-800 space-y-5">
                <h2 className="font-display text-base font-semibold text-white">
                  Brand Logo & Hero Banner
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Custom Store Logo (Optional — replaces default SVG emblem)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-slate-200 cursor-pointer">
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImagePlus className="w-4 h-4 text-cyan-400" />
                        )}
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(e) => handleCmsImageUpload(e, 'logoUrl')}
                          className="hidden"
                        />
                      </label>
                      {cmsForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setCmsForm((p) => ({ ...p, logoUrl: '' }))}
                          className="text-xs text-rose-400 hover:underline cursor-pointer"
                        >
                          Reset to Default SVG
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Hero Banner Image
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-slate-200 cursor-pointer">
                        {uploadingHero ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImagePlus className="w-4 h-4 text-cyan-400" />
                        )}
                        <span>Upload Banner Image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleCmsImageUpload(e, 'heroImage')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hero Headline (English)
                    </label>
                    <input
                      type="text"
                      value={cmsForm.heroTitleEn}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, heroTitleEn: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hero Headline (Bengali)
                    </label>
                    <input
                      type="text"
                      value={cmsForm.heroTitleBn}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, heroTitleBn: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hero Subtitle (English)
                    </label>
                    <textarea
                      rows={2}
                      value={cmsForm.heroSubtitleEn}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, heroSubtitleEn: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Hero Subtitle (Bengali)
                    </label>
                    <textarea
                      rows={2}
                      value={cmsForm.heroSubtitleBn}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, heroSubtitleBn: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Channels & Delivery Pricing */}
              <div className="p-6 rounded-xl bg-[#091124] border border-slate-800 space-y-4">
                <h2 className="font-display text-base font-semibold text-white">
                  Support Channels & COD Delivery Fees
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={cmsForm.whatsappNumber}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, whatsappNumber: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Facebook Page URL
                    </label>
                    <input
                      type="url"
                      value={cmsForm.facebookPageUrl}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, facebookPageUrl: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Admin Contact Email
                    </label>
                    <input
                      type="email"
                      value={cmsForm.contactEmail}
                      onChange={(e) =>
                        setCmsForm((p) => ({ ...p, contactEmail: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Inside Dhaka Fee (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cmsForm.dhakaDeliveryFee}
                      onChange={(e) =>
                        setCmsForm((p) => ({
                          ...p,
                          dhakaDeliveryFee: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Outside Dhaka Fee (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cmsForm.outsideDhakaDeliveryFee}
                      onChange={(e) =>
                        setCmsForm((p) => ({
                          ...p,
                          outsideDhakaDeliveryFee: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Free Delivery Threshold (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cmsForm.freeDeliveryThreshold}
                      onChange={(e) =>
                        setCmsForm((p) => ({
                          ...p,
                          freeDeliveryThreshold: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingCms}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {savingCms && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Content Changes</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 6: FIREBASE & LAUNCH SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="p-6 rounded-xl bg-[#091124] border border-slate-800 space-y-5 text-sm text-slate-300 leading-relaxed">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  Public Launch, SMTP Email & Firebase Setup Guide
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Reference checklist for deploying TRONIFY SHOP publicly with optional external Firebase & SMTP services.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-cyan-400">
                  1. Active Full-Stack Persistence (Ready Now)
                </h3>
                <p>
                  This build runs an Express backend with persistent disk storage (`.data/tronify-db.json`), server-hashed admin authentication (`scrypt`), signed HTTP-only cookies, local image uploads (`/uploads`), and server-validated COD order creation.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-cyan-400">
                  2. Enable Automated Customer & Admin Emails (Gmail SMTP / Resend)
                </h3>
                <p>
                  Configure these environment variables before launching so customer receipts and new-order alerts are emailed automatically to <span className="font-mono text-white">{settings.contactEmail}</span>:
                </p>
                <pre className="p-3 rounded-lg bg-[#050814] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="jamaluddinmishu@gmail.com"
SMTP_PASS="YOUR_GMAIL_APP_PASSWORD"`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-cyan-400">
                  3. Connecting Firebase (Auth, Firestore, Storage & Free Hosting)
                </h3>
                <p>
                  Full step-by-step instructions and production Firestore security rule templates are included in the repository file <span className="font-mono text-white">FIREBASE_SETUP.md</span>. When migrating to Firebase Hosting + Cloud Run or Firestore, enable Google Sign-In, create an <span className="font-mono text-white">/admins/{'{uid}'}</span> document for <span className="font-mono text-white">{settings.contactEmail}</span>, and deploy the rules before going live.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            onClick={() => setIsProductModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#070E20] border border-slate-800 rounded-xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Product Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.nameEn}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, nameEn: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Product Name (Bengali)
                  </label>
                  <input
                    type="text"
                    value={productForm.nameBn}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, nameBn: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((p) => ({
                        ...p,
                        category: e.target.value as CategoryId,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                  >
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c].en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, sku: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sale Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, price: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Original Price (৳)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={productForm.originalPrice}
                    onChange={(e) =>
                      setProductForm((p) => ({
                        ...p,
                        originalPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm font-mono text-white"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) =>
                        setProductForm((p) => ({ ...p, featured: e.target.checked }))
                      }
                      className="rounded border-slate-600 accent-cyan-500"
                    />
                    <span>Feature on Storefront</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Product Image (Upload or URL)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-slate-200 cursor-pointer">
                    {uploadingProductImg ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, image: e.target.value }))
                    }
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.descriptionEn}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, descriptionEn: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description (Bengali)
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.descriptionBn}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, descriptionBn: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-slate-700 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg bg-[#070E20] border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Order Invoice</p>
                <h3 className="font-mono text-lg font-bold text-cyan-400">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm space-y-1 bg-[#091124] p-4 rounded-lg border border-slate-800">
              <p className="text-white font-semibold">{selectedOrder.customerName}</p>
              <p className="font-mono text-xs text-slate-300">{selectedOrder.customerPhone}</p>
              <p className="text-slate-300 text-xs">
                {selectedOrder.address}, {selectedOrder.district}
              </p>
              {selectedOrder.note && (
                <p className="text-xs text-amber-300 pt-1">Note: {selectedOrder.note}</p>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              {selectedOrder.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-slate-200">
                    {item.nameEn} <span className="font-mono text-xs text-slate-400">x{item.quantity}</span>
                  </span>
                  <span className="font-mono tabular-nums text-white">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
                <span>Delivery</span>
                <span className="font-mono tabular-nums">
                  {formatBDT(selectedOrder.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white">
                <span>Total (COD)</span>
                <span className="font-mono tabular-nums text-cyan-400">
                  {formatBDT(selectedOrder.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Status: {selectedOrder.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
