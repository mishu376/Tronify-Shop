import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import { BANGLADESH_DISTRICTS, DEFAULT_STORE_SETTINGS, SEED_PRODUCTS } from './src/data/seed.ts';
import type { CustomerRecord, Order, OrderItem, OrderStatus, Product, StoreSettings } from './src/types.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'tronify-db.json');
const AUTH_FILE = path.join(DATA_DIR, 'tronify-auth.json');
const SECRET_FILE = path.join(DATA_DIR, 'tronify-secret.key');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'jamaluddinmishu@gmail.com').trim().toLowerCase();
const SESSION_COOKIE = 'tronify_session';
const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];
const VALID_CATEGORIES = new Set([
  'smart-watches',
  'earbuds',
  'headphones',
  'smart-gadgets',
  'accessories',
]);

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  customers: CustomerRecord[];
  settings: StoreSettings;
}

interface StoredAdminAuth {
  email: string;
  name: string;
  role: 'admin';
  salt: string;
  hash: string;
  createdAt: string;
}

function ensureDirectories() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDirectories();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
  return generated;
}

function atomicWriteJson(filePath: string, data: unknown) {
  ensureDirectories();
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function loadDatabase(): DatabaseSchema {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      products: SEED_PRODUCTS,
      orders: [],
      customers: [],
      settings: DEFAULT_STORE_SETTINGS,
    };
    atomicWriteJson(DB_FILE, initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : SEED_PRODUCTS,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      settings: { ...DEFAULT_STORE_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    const fallback: DatabaseSchema = {
      products: SEED_PRODUCTS,
      orders: [],
      customers: [],
      settings: DEFAULT_STORE_SETTINGS,
    };
    atomicWriteJson(DB_FILE, fallback);
    return fallback;
  }
}

function saveDatabase(db: DatabaseSchema) {
  atomicWriteJson(DB_FILE, db);
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function loadAdminAuth(): StoredAdminAuth | null {
  ensureDirectories();
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length >= 8) {
    const { salt, hash } = hashPassword(process.env.ADMIN_PASSWORD.trim(), 'env-static-salt');
    return {
      email: ADMIN_EMAIL,
      name: 'Store Administrator',
      role: 'admin',
      salt,
      hash,
      createdAt: new Date().toISOString(),
    };
  }
  if (!fs.existsSync(AUTH_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) as StoredAdminAuth;
  } catch {
    return null;
  }
}

interface SessionPayload {
  email: string;
  role: 'admin';
  name: string;
  exp: number;
}

function signSession(payload: SessionPayload): string {
  const secret = getSessionSecret();
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const secret = getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload || payload.role !== 'admin' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const flags = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  if (isProd) {
    flags.push('Secure');
  }
  res.setHeader('Set-Cookie', flags.join('; '));
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

interface AuthedRequest extends Request {
  adminUser?: SessionPayload;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const cookies = parseCookies(req);
  const session = verifySession(cookies[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  req.adminUser = session;
  next();
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendOrderEmails(
  order: Order,
  settings: StoreSettings
): Promise<Order['emailNotification']> {
  if (!isSmtpConfigured()) {
    return {
      configured: false,
      customerSent: false,
      adminSent: false,
      message: 'SMTP email service is not configured. Order saved in database.',
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromAddress = process.env.SMTP_FROM || `TRONIFY SHOP <${settings.contactEmail}>`;
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #1e293b;">${item.nameEn} (${item.sku})</td><td style="padding:6px 10px;border-bottom:1px solid #1e293b;">x${item.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #1e293b;">৳${item.price * item.quantity}</td></tr>`
    )
    .join('');

  let adminSent = false;
  let customerSent = false;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: settings.contactEmail,
      subject: `[TRONIFY SHOP] New COD Order ${order.orderNumber} — ৳${order.total}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#091124;color:#f1f5f9;padding:24px;border-radius:12px;">
          <h2 style="color:#22d3ee;margin-top:0;">New Order Received: ${order.orderNumber}</h2>
          <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
          <p><strong>District:</strong> ${order.district}<br/><strong>Address:</strong> ${order.address}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemsHtml}</table>
          <p><strong>Subtotal:</strong> ৳${order.subtotal}<br/><strong>Delivery:</strong> ৳${order.deliveryCharge}<br/><strong>Total (COD):</strong> ৳${order.total}</p>
        </div>
      `,
    });
    adminSent = true;
  } catch (err) {
    console.error('Failed to send admin order email:', err);
  }

  if (order.customerEmail) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: order.customerEmail,
        subject: `Order Confirmed: ${order.orderNumber} — TRONIFY SHOP`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#091124;color:#f1f5f9;padding:24px;border-radius:12px;">
            <h2 style="color:#22d3ee;margin-top:0;">Thank you for your order, ${order.customerName}!</h2>
            <p>Your Cash on Delivery order <strong>${order.orderNumber}</strong> has been received.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">${itemsHtml}</table>
            <p><strong>Total Payable (COD):</strong> ৳${order.total}</p>
            <p>Delivery to: ${order.address}, ${order.district}</p>
            <p style="color:#94a3b8;font-size:13px;">Questions? Contact ${settings.contactEmail} or WhatsApp ${settings.whatsappNumber}.</p>
          </div>
        `,
      });
      customerSent = true;
    } catch (err) {
      console.error('Failed to send customer confirmation email:', err);
    }
  }

  return {
    configured: true,
    customerSent,
    adminSent,
    message: customerSent
      ? 'Order confirmation emailed to customer and admin.'
      : adminSent
        ? 'Admin notification email sent.'
        : 'SMTP configured, but email delivery encountered an error.',
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

async function startServer() {
  ensureDirectories();
  loadDatabase();

  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Serve uploaded assets and generated local product images in both dev and production
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tronify-shop', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.get('/api/auth/status', (req, res) => {
    const admin = loadAdminAuth();
    const cookies = parseCookies(req);
    const session = verifySession(cookies[SESSION_COOKIE]);
    res.json({
      initialized: Boolean(admin),
      authenticated: Boolean(session),
      user: session ? { email: session.email, role: session.role, name: session.name } : null,
    });
  });

  app.post('/api/auth/setup', (req, res) => {
    const existing = loadAdminAuth();
    if (existing) {
      res.status(409).json({ error: 'Admin account is already initialized. Please sign in.' });
      return;
    }
    const { email, password, name } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (normalizedEmail !== ADMIN_EMAIL) {
      res.status(403).json({ error: `Admin setup is restricted to authorized email (${ADMIN_EMAIL}).` });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const adminRecord: StoredAdminAuth = {
      email: ADMIN_EMAIL,
      name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : 'Store Administrator',
      role: 'admin',
      salt,
      hash,
      createdAt: new Date().toISOString(),
    };
    atomicWriteJson(AUTH_FILE, adminRecord);

    const token = signSession({
      email: adminRecord.email,
      role: 'admin',
      name: adminRecord.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    setSessionCookie(res, token);
    res.status(201).json({
      user: { email: adminRecord.email, role: adminRecord.role, name: adminRecord.name },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const admin = loadAdminAuth();
    if (!admin) {
      res.status(400).json({ error: 'Admin account is not initialized yet.' });
      return;
    }
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (
      normalizedEmail !== admin.email ||
      typeof password !== 'string' ||
      !verifyPassword(password, admin.salt, admin.hash)
    ) {
      res.status(401).json({ error: 'Invalid administrator email or password.' });
      return;
    }
    const token = signSession({
      email: admin.email,
      role: 'admin',
      name: admin.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    setSessionCookie(res, token);
    res.json({
      user: { email: admin.email, role: admin.role, name: admin.name },
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // Public storefront
  app.get('/api/storefront', (_req, res) => {
    const db = loadDatabase();
    res.json({
      products: db.products,
      settings: db.settings,
    });
  });

  app.get('/api/products', (_req, res) => {
    const db = loadDatabase();
    res.json({ products: db.products });
  });

  // Admin: Product CRUD
  app.post('/api/products', requireAdmin, (req, res) => {
    const body = req.body || {};
    const nameEn = String(body.nameEn || '').trim();
    const nameBn = String(body.nameBn || nameEn).trim();
    const category = String(body.category || '').trim();
    const price = Number(body.price);
    const originalPrice = Number(body.originalPrice || price);
    const stock = Math.max(0, Math.floor(Number(body.stock ?? 0)));

    if (!nameEn || !VALID_CATEGORIES.has(category) || !Number.isFinite(price) || price <= 0) {
      res.status(400).json({ error: 'Valid English product name, category, and positive price are required.' });
      return;
    }

    const db = loadDatabase();
    const now = new Date().toISOString();
    const id = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const product: Product = {
      id,
      slug: `${slugify(nameEn)}-${id.slice(-4)}`,
      sku: String(body.sku || `TRN-${Date.now().toString().slice(-6)}`).trim().toUpperCase(),
      category: category as Product['category'],
      nameEn,
      nameBn,
      descriptionEn: String(body.descriptionEn || '').trim(),
      descriptionBn: String(body.descriptionBn || body.descriptionEn || '').trim(),
      price: Math.round(price),
      originalPrice: Math.max(Math.round(price), Math.round(originalPrice)),
      stock,
      image: String(body.image || '/src/assets/images/product_watch_apex_1794580120347.jpg').trim(),
      featured: Boolean(body.featured),
      specs: Array.isArray(body.specs) ? body.specs.slice(0, 8) : [],
      warrantyEn: String(body.warrantyEn || '6 Months Official Warranty').trim(),
      warrantyBn: String(body.warrantyBn || '৬ মাসের অফিসিয়াল ওয়ারেন্টি').trim(),
      createdAt: now,
      updatedAt: now,
    };

    db.products.unshift(product);
    saveDatabase(db);
    res.status(201).json({ product });
  });

  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const current = db.products[idx];
    const body = req.body || {};
    const nextPrice = body.price !== undefined ? Math.round(Number(body.price)) : current.price;
    const nextOriginal =
      body.originalPrice !== undefined
        ? Math.max(nextPrice, Math.round(Number(body.originalPrice)))
        : Math.max(nextPrice, current.originalPrice);

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      res.status(400).json({ error: 'Price must be greater than zero.' });
      return;
    }

    const nextCategory = body.category ? String(body.category) : current.category;
    if (!VALID_CATEGORIES.has(nextCategory)) {
      res.status(400).json({ error: 'Invalid category.' });
      return;
    }

    const updated: Product = {
      ...current,
      sku: body.sku !== undefined ? String(body.sku).trim().toUpperCase() : current.sku,
      category: nextCategory as Product['category'],
      nameEn: body.nameEn !== undefined ? String(body.nameEn).trim() : current.nameEn,
      nameBn: body.nameBn !== undefined ? String(body.nameBn).trim() : current.nameBn,
      descriptionEn: body.descriptionEn !== undefined ? String(body.descriptionEn).trim() : current.descriptionEn,
      descriptionBn: body.descriptionBn !== undefined ? String(body.descriptionBn).trim() : current.descriptionBn,
      price: nextPrice,
      originalPrice: nextOriginal,
      stock: body.stock !== undefined ? Math.max(0, Math.floor(Number(body.stock))) : current.stock,
      image: body.image !== undefined ? String(body.image).trim() : current.image,
      featured: body.featured !== undefined ? Boolean(body.featured) : current.featured,
      specs: Array.isArray(body.specs) ? body.specs.slice(0, 8) : current.specs,
      warrantyEn: body.warrantyEn !== undefined ? String(body.warrantyEn).trim() : current.warrantyEn,
      warrantyBn: body.warrantyBn !== undefined ? String(body.warrantyBn).trim() : current.warrantyBn,
      updatedAt: new Date().toISOString(),
    };

    db.products[idx] = updated;
    saveDatabase(db);
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const initialLen = db.products.length;
    db.products = db.products.filter((p) => p.id !== req.params.id);
    if (db.products.length === initialLen) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Admin: Image Upload
  app.post('/api/upload', requireAdmin, (req, res) => {
    const { filename, dataUrl } = req.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Invalid image payload.' });
      return;
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPG, WebP, or SVG.' });
      return;
    }

    const extMap: Record<string, string> = {
      png: 'png',
      jpeg: 'jpg',
      jpg: 'jpg',
      webp: 'webp',
      'svg+xml': 'svg',
    };
    const ext = extMap[match[1]] || 'png';
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be 5MB or smaller.' });
      return;
    }

    const safeBase = slugify(String(filename || 'upload').replace(/\.[^.]+$/, '')) || 'asset';
    const outName = `${safeBase}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);
    res.status(201).json({ url: `/uploads/${outName}` });
  });

  // Public: Secure Order Creation (Server-authoritative pricing & stock validation)
  app.post('/api/orders', async (req, res) => {
    const body = req.body || {};
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').replace(/\s+/g, '');
    const customerEmail = body.customerEmail ? String(body.customerEmail).trim().toLowerCase() : undefined;
    const district = String(body.district || '').trim();
    const address = String(body.address || '').trim();
    const note = body.note ? String(body.note).trim().slice(0, 300) : undefined;
    const requestedItems = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2 || customerName.length > 100) {
      res.status(400).json({ error: 'Please enter a valid full name.' });
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(customerPhone)) {
      res.status(400).json({ error: 'Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).' });
      return;
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address or leave it blank.' });
      return;
    }
    if (!BANGLADESH_DISTRICTS.includes(district)) {
      res.status(400).json({ error: 'Please select a valid district in Bangladesh.' });
      return;
    }
    if (address.length < 6 || address.length > 350) {
      res.status(400).json({ error: 'Please enter a complete delivery address.' });
      return;
    }
    if (requestedItems.length === 0 || requestedItems.length > 25) {
      res.status(400).json({ error: 'Your shopping bag is empty.' });
      return;
    }

    const db = loadDatabase();
    const verifiedItems: OrderItem[] = [];
    let subtotal = 0;

    // Merge duplicate productIds safely
    const qtyByProduct = new Map<string, number>();
    for (const rawItem of requestedItems) {
      const pid = String(rawItem?.productId || '');
      const qty = Math.floor(Number(rawItem?.quantity || 0));
      if (!pid || qty <= 0 || qty > 50) {
        res.status(400).json({ error: 'Invalid item quantity in order.' });
        return;
      }
      qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + qty);
    }

    for (const [productId, quantity] of qtyByProduct.entries()) {
      const product = db.products.find((p) => p.id === productId);
      if (!product) {
        res.status(404).json({ error: 'One or more products in your bag are no longer available.' });
        return;
      }
      if (product.stock < quantity) {
        res.status(409).json({
          error: `Insufficient stock for ${product.nameEn}. Available: ${product.stock}.`,
        });
        return;
      }
      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameBn: product.nameBn,
        price: product.price,
        quantity,
        image: product.image,
      });
      subtotal += product.price * quantity;
    }

    // Deduct stock
    for (const item of verifiedItems) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
        product.updatedAt = new Date().toISOString();
      }
    }

    const qualifiesFreeDelivery =
      db.settings.freeDeliveryThreshold > 0 && subtotal >= db.settings.freeDeliveryThreshold;
    const deliveryCharge = qualifiesFreeDelivery
      ? 0
      : district === 'Dhaka'
        ? db.settings.dhakaDeliveryFee
        : db.settings.outsideDhakaDeliveryFee;
    const total = subtotal + deliveryCharge;

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = crypto.randomInt(1000, 9999);
    const orderNumber = `TRN-${datePart}-${randomPart}`;
    const nowIso = now.toISOString();

    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 10)}`,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      district,
      address,
      note,
      items: verifiedItems,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod: 'COD',
      status: 'Pending',
      emailNotification: {
        configured: false,
        customerSent: false,
        adminSent: false,
        message: 'Checking email notification service...',
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    order.emailNotification = await sendOrderEmails(order, db.settings);
    db.orders.unshift(order);

    // Upsert customer record by phone
    const existingCustomer = db.customers.find((c) => c.phone === customerPhone);
    if (existingCustomer) {
      existingCustomer.name = customerName;
      existingCustomer.email = customerEmail || existingCustomer.email;
      existingCustomer.district = district;
      existingCustomer.address = address;
      existingCustomer.totalOrders += 1;
      existingCustomer.totalSpent += total;
      existingCustomer.lastOrderAt = nowIso;
    } else {
      db.customers.unshift({
        id: `cust-${crypto.randomUUID().slice(0, 8)}`,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        district,
        address,
        totalOrders: 1,
        totalSpent: total,
        lastOrderAt: nowIso,
        createdAt: nowIso,
      });
    }

    saveDatabase(db);
    res.status(201).json({ order });
  });

  // Public: Order Tracking (requires both Order Number and Phone to protect PII)
  app.get('/api/orders/track', (req, res) => {
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    const phone = String(req.query.phone || '').replace(/\s+/g, '');
    if (!orderNumber || !phone) {
      res.status(400).json({ error: 'Order ID and mobile number are required.' });
      return;
    }
    const db = loadDatabase();
    const order = db.orders.find(
      (o) => o.orderNumber.toUpperCase() === orderNumber && o.customerPhone === phone
    );
    if (!order) {
      res.status(404).json({ error: 'No matching order found for that Order ID and mobile number.' });
      return;
    }
    res.json({ order });
  });

  // Admin: Orders & Status management
  app.get('/api/orders', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.json({ orders: db.orders });
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const nextStatus = String(req.body?.status || '') as OrderStatus;
    if (!VALID_ORDER_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const db = loadDatabase();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const prevStatus = order.status;
    if (prevStatus !== 'Cancelled' && nextStatus === 'Cancelled') {
      // Restore stock on cancellation
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
          product.updatedAt = new Date().toISOString();
        }
      }
    } else if (prevStatus === 'Cancelled' && nextStatus !== 'Cancelled') {
      // Re-reserve stock if un-cancelled
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          res.status(409).json({
            error: `Cannot reactivate order: insufficient stock for ${item.nameEn}.`,
          });
          return;
        }
      }
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock -= item.quantity;
          product.updatedAt = new Date().toISOString();
        }
      }
    }

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ order });
  });

  // Admin: Customers & Analytics
  app.get('/api/customers', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.json({ customers: db.customers });
  });

  app.get('/api/analytics', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    const activeOrders = db.orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const deliveredRevenue = db.orders
      .filter((o) => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.total, 0);

    const statusCounts: Record<OrderStatus, number> = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    for (const order of db.orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    const categoryRevenue: Record<string, number> = {
      'smart-watches': 0,
      earbuds: 0,
      headphones: 0,
      'smart-gadgets': 0,
      accessories: 0,
    };
    for (const order of activeOrders) {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod) {
          categoryRevenue[prod.category] =
            (categoryRevenue[prod.category] || 0) + item.price * item.quantity;
        }
      }
    }

    const lowStockProducts = db.products.filter((p) => p.stock <= 5).length;

    res.json({
      totalRevenue,
      deliveredRevenue,
      totalOrders: db.orders.length,
      pendingOrders: statusCounts.Pending,
      totalCustomers: db.customers.length,
      totalProducts: db.products.length,
      lowStockProducts,
      statusCounts,
      categoryRevenue,
    });
  });

  // Admin: Settings & Email Status
  app.put('/api/settings', requireAdmin, (req, res) => {
    const db = loadDatabase();
    const body = req.body || {};
    db.settings = {
      ...db.settings,
      ...body,
      dhakaDeliveryFee: Math.max(0, Number(body.dhakaDeliveryFee ?? db.settings.dhakaDeliveryFee)),
      outsideDhakaDeliveryFee: Math.max(
        0,
        Number(body.outsideDhakaDeliveryFee ?? db.settings.outsideDhakaDeliveryFee)
      ),
      freeDeliveryThreshold: Math.max(
        0,
        Number(body.freeDeliveryThreshold ?? db.settings.freeDeliveryThreshold)
      ),
    };
    saveDatabase(db);
    res.json({ settings: db.settings });
  });

  app.get('/api/email/status', requireAdmin, (_req, res) => {
    const db = loadDatabase();
    res.json({
      configured: isSmtpConfigured(),
      adminContactEmail: db.settings.contactEmail,
      smtpHost: process.env.SMTP_HOST || null,
    });
  });

  // Frontend middleware (Vite in dev, dist in production)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRONIFY SHOP server listening on http://localhost:${PORT}`);
  });
}

startServer();
