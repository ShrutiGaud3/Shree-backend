# Shree Client — Toys & Jewellery Storefront

React 19 + Vite 7 + Tailwind v4 + React Router 7 + Axios. No Redux — auth lives in
`src/context/AuthContext.jsx`, data is fetched per-page with loading/error states.

## Run

```bash
npm install
npm run dev      # vite on :5173, /api proxied to http://localhost:8080 (vite.config.js)
npm run build    # production bundle
```

Backend must be running (`npm run dev` in repo root) with a working `MONGO_URI`.

## Structure

- `src/config/site.js` — `STORE_NAME`, categories, sort options, order timeline (only place the name lives)
- `src/index.css` — brand palette as CSS vars + Tailwind v4 `@theme` tokens (no hex in components)
- `src/api/client.js` — axios instance (JWT, 401 → login), `loadRazorpay()` for checkout.js
- `src/components/` — `Layout` (text-logo header + footer), `Guards` (Protected/AdminOnly),
  `ProductCard`, `ui` primitives (Loader, ErrorState, Stars, Price, fields, buttons)
- `src/pages/` — Home, Products, ProductDetail, Cart, Checkout, Orders, OrderDetail,
  Login, Register, ForgotPassword, ResetPassword, Chat, Account, Legal (Privacy, Terms, Refunds, Shipping, Contact)
- `src/pages/admin/` — Dashboard, Products (multipart upload), Orders (transition buttons),
  Coupons, Users (block/unblock)

## Checkout flow

COD: address → coupon → place order. Prepaid: same, then Razorpay checkout.js
(`key` from `GET /api/payments/key`, `orderId` from `POST /api/orders`) →
`POST /api/payments/verify`. Unpaid orders auto-cancel after 30 min; pay again from Order detail.
