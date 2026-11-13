# TRONIFY SHOP — Production Launch, Firebase & Email Setup Guide

This application currently runs on a self-contained **Express + Vite** full-stack architecture with persistent server disk storage (`.data/tronify-db.json`), server-hashed administrator authentication (`scrypt` + signed HTTP-only cookies), local image uploads (`/uploads`), server-authoritative Cash on Delivery (COD) checkout, and optional SMTP email integration.

---

## 1. Environment Variables (`.env`)

Create a `.env` file (or configure Secrets in your hosting provider) using `.env.example`:

```env
PORT=3000
ADMIN_EMAIL="jamaluddinmishu@gmail.com"
# Optional: pre-seed admin password via env instead of the first-time web setup screen
ADMIN_PASSWORD=""
# Strong random 32+ character secret for session cookies
SESSION_SECRET=""

# Optional Gmail SMTP for customer receipts & admin order alerts
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="jamaluddinmishu@gmail.com"
SMTP_PASS="YOUR_16_CHAR_GMAIL_APP_PASSWORD"
SMTP_FROM="TRONIFY SHOP <jamaluddinmishu@gmail.com>"
```

> **Note on Emails**: The app will never pretend an email was sent. Until `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are configured, order receipts display a clear notice that SMTP email delivery is inactive.

---

## 2. Optional Migration to Firebase (Auth, Firestore, Storage & Free Hosting)

If you want to host the static frontend on **Firebase Hosting (Free Spark Plan)** and store products, orders, and images in **Cloud Firestore** and **Firebase Storage**:

1. **Create a Firebase Project**:
   - Visit [console.firebase.google.com](https://console.firebase.google.com) and create a project (e.g., `tronify-shop-bd`).
   - Register a **Web App** and copy the Firebase config keys into `.env` (`VITE_FIREBASE_*`).
2. **Enable Authentication**:
   - Go to **Build -> Authentication -> Sign-in method** and enable **Google** (or Email/Password).
3. **Create Cloud Firestore & Storage**:
   - Go to **Build -> Firestore Database -> Create database** (choose `asia-south1` Mumbai or `asia-southeast1` Singapore for lowest latency in Bangladesh).
   - Go to **Build -> Storage -> Get started** for product image uploads.
4. **Authorize Admin Role in Firestore**:
   - Create a collection named `admins` and add a document whose Document ID is your Firebase Auth UID (or check `request.auth.token.email == 'jamaluddinmishu@gmail.com' && request.auth.token.email_verified == true` in rules).
5. **Recommended Firestore Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email_verified == true
        && (
          exists(/databases/$(database)/documents/admins/$(request.auth.uid))
          || request.auth.token.email == 'jamaluddinmishu@gmail.com'
        );
    }

    // Public catalog & storefront settings
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Orders: validated COD creation (or via Cloud Function for stock atomicity), admin-only listing/updates
    match /orders/{orderId} {
      allow create: if request.resource.data.keys().hasAll([
          'orderNumber', 'customerName', 'customerPhone', 'district', 'address', 'items', 'total', 'status'
        ])
        && request.resource.data.status == 'Pending'
        && request.resource.data.paymentMethod == 'COD'
        && request.resource.data.customerPhone.matches('^01[3-9][0-9]{8}$');
      allow read, update, delete: if isAdmin();
    }

    // Customer PII strictly restricted to Admin
    match /customers/{customerId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 3. Free Hosting & Public Launch

- **Option A — Render / Railway / Fly.io (Recommended for Express + Disk Storage)**:
  1. Push this repository to GitHub.
  2. Set Build Command: `npm install && npm run build`
  3. Set Start Command: `npm start`
  4. Attach a persistent volume at `/app/.data` (so products, uploaded images, and orders persist across deploys) and configure `ADMIN_EMAIL`, `SESSION_SECRET`, and `SMTP_*` environment variables.
- **Option B — Firebase Hosting + Cloud Run**:
  1. Containerize the Express app (`npm run build && npm start` on port `8080`/`3000`) and deploy to Cloud Run.
  2. Point `firebase.json` hosting rewrites (`/**`) to your Cloud Run service for free global CDN + custom domain SSL.
