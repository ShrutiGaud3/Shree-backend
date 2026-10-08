# AUDIT — Shree (Existing Project, Read-Only Step)

> No code modified in this step. This file is the only creation.

## 1. Stack & Structure

### Backend — `D:\Shree\server` (Node + Express 5 ESM, JS, MongoDB + Mongoose, Zod, JWT, Razorpay, Cloudinary, Nodemailer, Gemini)
```
server/server.js            → express app, helmet/cors/pino, rate-limit, mounts, notFound+errorHandler, stale-order job
server/config/              → categories.js, dbConfig.js, brand.js, storeConfig.js
server/models/ (6)          → userModel, productModel, cartModel, orderModel, couponModel, reviewModel
server/validators/ (1)      → schemas.js (Zod, {body,query,params} shape)
server/middleware/ (7)      → authMiddleware, validate, rateLimit, productForm, cloudinaryMiddleware, notFound, errorHandler
server/controllers/ (9)     → auth, admin, product, cart, order, payment, coupon, review, chatBot
server/routes/ (9)          → auth, admin, product, cart, order, payment, coupon, review, chatBot
server/utils/ (9)           → coupon, asyncHandler, stock, staleOrders, sendEmail, razorpay, orderService, orderEmails, logger
server/seed.js              → idempotent seed (1 admin + 20 products by SKU)
```
- Root `package.json`: `start: node server/server.js`, `dev: node --env-file=.env --watch server/server.js`, `seed: node server/seed.js`, `type: module`.
- Env (see `.env.example`, 42 lines): `PORT, NODE_ENV, LOG_LEVEL, CORS_ORIGIN, RATE_LIMIT_*,
  MONGO_URI, JWT_SECRET, CLOUDINARY_*, GEMINI_API_KEY, SMTP_*, SMTP_FROM, FRONTEND_URL,
  RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET`.
- Layering: `routes → validate(Zod) → protect → controller → models/utils`. No service folder except `utils/orderService.js`, `utils/stock.js`, `utils/coupon.js`. `asyncHandler` exists but unused.
- Error handling: central `errorHandler` (CastError→404, 11000→409, Zod→400, JWT→401, Multer→400, cloudinary→502).

### Auth method (backend)
- JWT Bearer (`Authorization: Bearer <token>`, 30-day expiry on register/login), secret `JWT_SECRET`.
- `middleware/authMiddleware.js`: `protect.forAuthUsers` (401 if missing/inactive/blocked),
  `protect.forAdmin` (+403 if `!isAdmin`), `protect.forAdminOrSelf`, `protect.optionalAuth`.
- Roles: boolean `User.isAdmin` only. No staff/manager/RBAC.
- Password: `bcryptjs` hash; forgot/reset via `sha256(random32B)` token + 30 min expiry, link `${FRONTEND_URL}/reset-password/<token>`, anti-enumeration 200 always.

### DB models (Mongoose, summary — full fields verified)
- `User`: name, email(unique), phone(unique, /^[6-9]\d{9}$/), password(select:false),
  addresses[] {label enum[home,work,other], name, phone, line1, line2, city, state, pincode, country=India, isDefault},
  isAdmin/isBlocked/isActive, resetPasswordToken/Expires, emailVerified/emailVerifyToken/Expires, timestamps.
  Index: `{isActive:1}`. Virtual: `defaultAddress`.
- `Product`: name, slug(unique), description, shortDescription, images[{url,publicId,alt,isPrimary}],
  category enum[toys,jewellery], subCategory (validated vs `config/categories.js`),
  brand, sku(unique,uppercase), tags[], mrp, price, stock, variants[{label,sku(unique sparse),price,stock,images,attributes}],
  toysFields{ageGroup enum[0-3,3-6,6-12,12+], safetyCertifications[], batteryRequired},
  jewelleryFields{material enum[gold-plated,silver-925,artificial,platinum-plated,rose-gold-plated,brass,copper], purity, stoneType, weightGrams, hallmarkNumber, careInstructions},
  gstRate default 18, isReturnable default true, metaTitle/metaDescription, isActive, isFeatured,
  ratingAvg/ratingCount/soldCount/viewCount. Indexes: text(name,description,tags,brand), {category,subCategory}, {price}, {createdAt}, {ratingAvg}, {isActive,category,subCategory}, {isFeatured,isActive}. Virtuals: totalStock, minPrice, discountPercent, inStock.
- `Cart`: user(unique) ref, items[{product ref, variant{sku,label,attributes,price}, qty, priceSnapshot}]. Virtuals: totalItems, subtotal.
- `Order`: user ref, items[{product ref, variant, qty, unitPrice, mrp, gstRate, gstAmount, taxableAmount, discount, productSnapshot{name,images,category,subCategory}}],
  shippingAddress{name,phone,line1,line2,city,state,pincode,country},
  subtotal, totalDiscount, totalTaxable, totalGst, shippingFee, totalAmount,
  coupon ref + couponCode + couponDiscount,
  status enum[placed,confirmed,processing,shipped,delivered,cancelled,returned,refunded,rejected,completed] default placed,
  payment{method enum[cod,razorpay], status enum[pending,paid,failed,refunded,partially_refunded], razorpayOrderId/PaymentId/Signature, codConfirmed, refundId/Amount/Reason/At, amount, currency},
  statusHistory[], cancellation*, return* (incl returnItems[]), adminNotes/customerNotes, trackingNumber/Url, shippedAt/deliveredAt. Indexes: {user,createdAt}, {status,createdAt}, payment ids. Server-calculated totals; COD cap 5000; free ship ≥999 else 99.
- `Coupon`: code(unique,uppercase), description, discountType enum[percentage,fixed], discountValue, maxDiscount, minOrderValue,
  applicableCategory enum[toys,jewellery,all], usageLimit/usedCount/perUserLimit, startsAt/expiresAt, isActive, createdBy. Methods: canApply, calculateDiscount.
- `Review`: user+product (unique pair) + order?, rating 1-5, title, text, images[], isVerifiedBuyer (set if delivered/completed order exists), isApproved default true, adminResponse{}, helpfulCount, reportedCount.

### Frontend — `D:\Shree\client` (React 19 + Vite 7 + JS/JSX, Tailwind v4 CSS-first, axios, react-router-dom 7, lucide-react, react-toastify)
```
client/src/main.jsx → StrictMode → App
client/src/App.jsx → AuthProvider > BrowserRouter > Layout route + ChatFab + ToastContainer
client/src/config/site.js → STORE_NAME, API_BASE="/api", CATEGORIES, SORT_OPTIONS, ORDER_TIMELINE, TERMINAL_STATUS
client/src/api/client.js → axios baseURL /api, TOKEN_KEY=shree_token, Bearer interceptor, 401→clear+redirect /login, apiError(), loadRazorpay()
client/src/context/AuthContext.jsx → user, loading, isLoggedIn, isAdmin, login/register/logout (localStorage shree_token + shree_user)
client/src/components/ → Layout.jsx (Header, MobileDrawer, MobileBottomNav, Footer), Guards.jsx (Protected, AdminOnly), ui.jsx (~25 primitives), ProductCard.jsx
client/src/pages/ → Home, Products, ProductDetail, Cart, Checkout, Orders, OrderDetail, Login, Register, ForgotPassword, ResetPassword, Account, Chat, Legal (Privacy/Terms/Refunds/Shipping/Contact), NotFound
client/src/pages/admin/ → AdminLayout, Dashboard, Products, Orders, Coupons, Users
client/src/index.css → @theme tokens, fonts (Playfair Display + Cormorant + Outfit + Plus Jakarta Sans)
```
- No `hooks/`, `store/`, `services/`, `utils/` dirs. `@reduxjs/toolkit` + `react-redux` in package.json but **zero usage** (no store/Provider).
- State: `AuthContext` + per-page `useState/useEffect`; session in `localStorage`; cart count refetched in `Layout`.
- Design tokens (actual `index.css`): primary #FFAFCC, primary-hover #FF94B8, bg #FCFBF7, surface #FDF9F0, accent #D0A375, text #362217, muted #7A6557, border #EFE7D8. Fonts: Playfair Display/Cormorant (serif), Outfit, Plus Jakarta Sans (body). Rounded-2xl/3xl, soft shadows. (AGENTS.md cream/pink/ink values are aspirational, not 1:1 with code.)
- `vite.config.js` proxy `/api → http://localhost:8080`.

## 2. Backend Endpoints (ALL, full path + auth)

Base: `GET /` (public), `GET /api/health` (public, db readyState).

| Method | Full path | Auth | Handler |
|---|---|---|---|
| POST | `/api/auth/register` | public + validate(registerSchema) + authLimiter | registerUser |
| POST | `/api/auth/login` | public + validate(loginSchema) + authLimiter | loginUser |
| POST | `/api/auth/forgot-password` | public + validate | forgotPassword |
| POST | `/api/auth/reset-password/:token` | public + validate | resetPassword |
| GET | `/api/auth/addresses` | forAuthUsers | getAddresses |
| POST | `/api/auth/addresses` | forAuthUsers + validate | addAddress |
| PUT | `/api/auth/addresses/:aid` | forAuthUsers + validate | updateAddress |
| DELETE | `/api/auth/addresses/:aid` | forAuthUsers + validate | deleteAddress |
| POST | `/api/auth/private` | forAuthUsers | privateAccess |
| GET | `/api/admin/dashboard` | forAdmin | getDashboard (today/totals revenue paid-only, ordersByStatus, lowStock ≤5) |
| GET | `/api/admin/users` | forAdmin | getUsers |
| PUT | `/api/admin/users/:uid` | forAdmin + validate(updateUserSchema) | updateUser (isBlocked/isActive/isAdmin only) |
| GET | `/api/admin/orders` | forAdmin | getAllOrders |
| PUT | `/api/admin/orders/:oid` | forAdmin + validate(updateOrderStatusSchema) | updateOrderStatus (STORE_CONFIG transitions; cancelled→cancelOrderAndRelease) |
| GET | `/api/admin/products` | forAdmin | getProductsAdmin (incl inactive) |
| POST | `/api/admin/products` | forAdmin + uploadMultiple + normalizeProductBody + validate(createProductSchema) | createProduct (Cloudinary ≤5 imgs) |
| PUT | `/api/admin/products/:pid` | forAdmin + uploadMultiple + normalize + validate(updateProductSchema) | updateProduct (append/remove images, primary ensure) |
| DELETE | `/api/admin/products/:pid` | forAdmin | deleteProduct (soft isActive:false) |
| GET | `/api/admin/coupons` | forAdmin | getCouponsAdmin |
| POST | `/api/admin/coupons` | forAdmin + validate(createCouponSchema) | createCoupon |
| PUT | `/api/admin/coupons/:cid` | forAdmin + validate(updateCouponSchema) | updateCoupon |
| DELETE | `/api/admin/coupons/:cid` | forAdmin + validate | deleteCoupon (hard if usedCount 0 else deactivate) |
| GET | `/api/products/` | public + validate(productQuerySchema) | getProducts (q/category/subCategory/minPrice/maxPrice/ageGroup/material/sort/page/limit) |
| GET | `/api/products/:pid` | public (ObjectId or slug) | getProduct (+viewCount fire-forget) |
| GET | `/api/products/search/:query` | public | searchProduct → getProducts |
| GET | `/api/products/:pid/review/` | public | getReviews |
| POST | `/api/products/:pid/review/` | forAuthUsers + validate(createReviewSchema) | addReview |
| GET | `/api/reviews/` | public | getReviews (no pid → all approved; direct mount) |
| POST | `/api/reviews/` | forAuthUsers + validate | addReview |
| DELETE | `/api/reviews/:rid` | forAuthUsers (owner-or-admin) | removeReview |
| GET | `/api/cart/` | forAuthUsers | getCart (populate product) |
| POST | `/api/cart/` | forAuthUsers + validate(addToCartSchema) | addToCart (variant required if exists, stock cap) |
| PUT | `/api/cart/:cid` | forAuthUsers + validate(updateCartSchema) | updateCart (NOTE: `:cid` param unused; reads productId from body) |
| DELETE | `/api/cart/:productId` | forAuthUsers (?variantSku=) | removeCart |
| POST | `/api/cart/clear` | forAuthUsers | clearCart |
| GET | `/api/orders/` | forAuthUsers | getMyOrders |
| GET | `/api/orders/:oid` | forAuthUsers (ownership) | getMyOrder |
| POST | `/api/orders/` | forAuthUsers + validate(createOrderSchema) | createOrder (server totals, reserveStock, Razorpay order if prepaid, clear cart) |
| PUT | `/api/orders/:oid` | forAuthUsers + validate(cancelOrderSchema) | cancelOrder (cancelOrderAndRelease + refund if paid) |
| GET | `/api/payments/key` | public (503 if unconfigured) | getKey |
| POST | `/api/payments/verify` | forAuthUsers + validate(verifyPaymentSchema) | verifyPayment (HMAC, idempotent, placed+pending only) |
| POST | `/api/payments/webhook` | public raw-body + webhook-signature | webhook (payment.captured→paid/confirmed, payment.failed→failed) |
| GET | `/api/coupons/` | public | getCoupons (active+date-valid, public fields) |
| POST | `/api/coupons/apply` | forAuthUsers + validate(applyCouponSchema) | applyCoupon |
| POST | `/api/chat/` | forAuthUsers + validate(chatSchema) | getAnswer (Gemini 2.5-flash, ≤50 in-stock products context, 503 if no key) |

Note: `updateOrderStatusSchema` excludes `placed`/`rejected` although Order enum includes them — admin cannot set those two via API.

## 3. Frontend Routes / Pages / Components / State

### Routes (`App.jsx`, 24 entries, all under `<Layout/>`)
| Path | Element | Guard |
|---|---|---|
| `/` | Home | — |
| `/products` | Products | — |
| `/products/:pid` | ProductDetail | — |
| `/login` | Login | — |
| `/register` | Register | — |
| `/forgot-password` | ForgotPassword | — |
| `/reset-password/:token` | ResetPassword | — |
| `/chat` | Chat (AI assistant, auth API) | — (page public, API needs token) |
| `/privacy` | Privacy | — |
| `/terms` | Terms | — |
| `/refunds` | Refunds | — |
| `/shipping` | Shipping | — |
| `/contact` | Contact | — |
| `/cart` | Cart | Protected |
| `/checkout` | Checkout | Protected |
| `/orders` | Orders (+StatusTimeline) | Protected |
| `/orders/:oid` | OrderDetail | Protected |
| `/account` | Account (profile + addresses) | Protected |
| `/admin` | AdminLayout + Dashboard | AdminOnly |
| `/admin/products` | ProductsAdmin | AdminOnly |
| `/admin/orders` | OrdersAdmin | AdminOnly |
| `/admin/coupons` | CouponsAdmin | AdminOnly |
| `/admin/users` | UsersAdmin | AdminOnly |
| `*` | NotFound | — |

### Pages (what each does + API used)
- `Home.jsx`: 2-slide hero (jewellery/toys) + category pills + 8-tile collections + Featured&Bestsellers (`GET /products?limit=8`) + trust strip. States loading/error/done.
- `Products.jsx`: URL-param filters (q/category/subCategory/minPrice/maxPrice/ageGroup/material/sort/page), sidebar + mobile Drawer, active-filter chips, `GET /products`, Pagination. No colour/rating/availability filters.
- `ProductDetail.jsx`: gallery (thumbs, no zoom) + variants + stock alerts + qty + Add/BuyNow (`POST /cart`) + specs/shipping/care tabs (toysFields/jewelleryFields) + reviews list/form (`GET|POST /products/:id/review/`) + related (`GET /products?category&limit=4`) + sticky mobile bar.
- `Cart.jsx`: `GET /cart`, `PUT /cart/ignore` (sic — literal "ignore" as :cid), `DELETE /cart/:id`, free-ship progress (999), client-side subtotal, link to /checkout. No drawer.
- `Checkout.jsx`: address select + inline add (`GET|POST /auth/addresses`), coupon text input (applied at `POST /orders`, no pre-validate call), COD/Razorpay radio, `POST /orders` + Razorpay checkout + `POST /payments/verify`. No gift wrap/message, no order summary lines (server calculates).
- `Orders.jsx` / `OrderDetail.jsx`: list + detail, StatusTimeline (placed→confirmed→processing→shipped→delivered→completed; terminal badge), pay-now (`GET /payments/key` + verify), cancel (`PUT /orders/:oid`). No invoice download, no returns/refunds UI.
- `Login/Register/Forgot/Reset`: email+password only; no Google/OTP.
- `Account.jsx`: profile header (name/email/phone, read-only) + addresses CRUD (`GET|POST|PUT|DELETE /auth/addresses`). No profile edit, no wishlist, no order link beyond button.
- `Chat.jsx`: `POST /chat {question}`.
- `Legal.jsx`: Privacy/Terms/Refunds/Shipping/Contact (static; Contact = email card + hours + AI-assistant CTA; no form/POST).
- `NotFound.jsx`: 404.
- Admin: `AdminLayout` (sidebar), `Dashboard` (6 KPI cards + orders-by-status + low-stock; no charts), `Products` (table + FormData create/edit + isActive toggle + delete), `Orders` (list + status update), `Coupons` (CRUD), `Users` (list + block/active/admin toggles).

### Components / state
- `Layout.jsx`: Header (logo, Home/Shop/Collections-dropdown/About→/privacy/Contact, search modal→/products?q=, account dropdown, cart badge; no wishlist icon, no announcement bar), MobileDrawer, MobileBottomNav (Home/Shop/Cart/Account/Assistant), minimal Footer (5 links + 3 socials + copyright).
- `Guards.jsx`: Protected (→/login w/ from), AdminOnly (→/ or /login).
- `ui.jsx`: Button/Input/Select/Textarea/Checkbox/Badge/Chip/Card/Modal/Drawer/Tabs/AccordionItem/Breadcrumb/Pagination/Skeleton/Loader/ErrorState/EmptyState/Stars/RatingSelect/Price/QuantityStepper/SectionTitle/Field.
- `ProductCard.jsx`: image, badges, price, rating, `POST /cart`.
- State: only `AuthContext` (user/loading/login/register/logout); everything else local `useState`. No Redux/Zustand usage despite deps.

## 4. Checklist Comparison

### STOREFRONT
| Item | Status | Evidence / missing part |
|---|---|---|
| announcement bar | ❌ Missing | No bar in Layout/Header |
| header (search, wishlist, cart, account) | 🟡 Partial | search ✅ (`/products?q=`), cart ✅ (badge+page), account ✅ (dropdown); wishlist ❌ (FE+BE none) |
| hero banner | ✅ Complete | FE+BE (2-slide carousel → /products links; no BE needed) |
| categories | ✅ Complete | FE (dropdown + pills + 8 tiles) + BE (config + category/subCategory filter) |
| new arrivals | 🟡 Partial | BE supports `sort=newest`; FE has no dedicated section (only combined Featured&Bestsellers) |
| best sellers | 🟡 Partial | BE has `soldCount` but no sort/endpoint; FE combined section only |
| offer countdown | ❌ Missing | No timer, no offer model |
| why-choose-us | ✅ Complete | FE trust strip (4 badges); static, no BE needed |
| testimonials | ❌ Missing | No section, no model/endpoint |
| gallery | ❌ Missing | No gallery section/model |
| newsletter | ❌ Missing | No signup, no model/endpoint |
| footer | 🟡 Partial | FE minimal (logo/5 links/socials/copyright); missing sitemap columns, payment icons, policies links, newsletter |
| listing filters (category, price, age group, material, colour, rating, availability) | 🟡 Partial | BE+FE: category, price, ageGroup, material ✅; colour ❌, rating ❌, availability ❌ (both) |
| sort | ✅ Complete | FE+BE: newest, price_asc, price_desc, rating |
| pagination | ✅ Complete | FE+BE: page/limit/totalPages/total |
| product detail (gallery zoom, variants, stock, pincode check, safety/care, reviews, related, recently viewed) | 🟡 Partial | variants ✅, stock ✅, safety/care tabs ✅, reviews ✅, related ✅; zoom ❌, pincode check ❌, recently viewed ❌ |
| cart drawer + page | 🟡 Partial | Page ✅ (FE+BE); drawer ❌ |
| coupons | ✅ Complete | FE (checkout input + admin CRUD) + BE (validate/apply) |
| checkout (address, payment Razorpay+COD, gift wrap+message) | 🟡 Partial | address ✅, Razorpay+COD ✅; gift wrap + message ❌ (FE+BE) |
| order success | 🟡 Partial | BE creates order; FE navigates to `/orders/:oid` — no dedicated success page |
| auth (email, Google, OTP) | 🟡 Partial | email+password + forgot/reset ✅; Google ❌, OTP ❌ |
| account (profile, addresses, orders+tracking timeline, wishlist) | 🟡 Partial | profile view ✅ (no edit), addresses ✅, orders+timeline ✅; wishlist ❌ |
| About | ❌ Missing | Nav "About" links to `/privacy`; no About page/content |
| Contact | ✅ Complete | Static page (email/hours/AI CTA); no form/BE (acceptable as complete for current scope) |
| FAQ | ❌ Missing | No page/model |
| Shipping & Returns | ✅ Complete | `/shipping` + `/refunds` pages + product tabs |
| Privacy | ✅ Complete | `/privacy` static |
| Terms | ✅ Complete | `/terms` static |
| 404 | ✅ Complete | `*` → NotFound |

### ADMIN
| Item | Status | Evidence / missing part |
|---|---|---|
| dashboard (KPIs, sales chart, category pie, top products, low-stock, recent orders) | 🟡 Partial | KPIs ✅, low-stock ✅, ordersByStatus ✅; sales chart ❌, category pie ❌, top products ❌, recent orders ❌ |
| products (CRUD, multi-image, variants, SKU, stock, SEO, draft/publish, CSV upload) | 🟡 Partial | All ✅ except CSV upload ❌ (CRUD soft-delete, ≤5 Cloudinary imgs, variants, SKU, stock, metaTitle/Description, isActive draft/publish) |
| categories | ❌ Missing | Hardcoded `config/categories.js`; no CRUD UI/endpoint |
| inventory | 🟡 Partial | BE stock utils + FE low-stock + stock edit via product form; no dedicated inventory page |
| orders (status flow, invoice PDF, refunds) | 🟡 Partial | Status flow ✅ (transitions + admin update + customer cancel); invoice PDF ❌; refunds: BE auto-refund on cancel (Razorpay) but no FE refund button/history |
| customers | 🟡 Partial | List + block/active/admin toggle ✅; no detail page, no per-customer orders |
| payments | ❌ Missing | No admin page; only BE verify/webhook + FE checkout |
| coupons | ✅ Complete | Admin CRUD + public list + apply (FE+BE) |
| CMS (banners, homepage sections, testimonials, FAQs, pages) | ❌ Missing | Homepage hardcoded (HERO_SLIDES, tiles); no Banner/Section/Testimonial/FAQ/Page model or admin |
| reviews moderation | 🟡 Partial | BE has isApproved/reportedCount + delete; FE: no admin UI, no approve/reply flow (only customer add + owner delete) |
| shipping & tax | ❌ Missing | Hardcoded `storeConfig` (999/99) + per-product gstRate; no admin UI/endpoint |
| reports with CSV/PDF export | ❌ Missing | No export anywhere |
| notifications | ❌ Missing | Only fire-forget order/password emails; no notification center/model |
| settings | ❌ Missing | No settings page/model (storeConfig static) |
| support messages | ❌ Missing | Contact static; no message model/endpoint/admin inbox |

## 5. Risks (where additive work could break existing code)

1. **Order totals / coupon / stock are server-authoritative** (`orderController.createOrder`, `utils/stock.js`, `utils/coupon.js`). Any FE price math or new discount/gift-fee must NOT duplicate logic — add fields to Order + include in `calculateTotals`, else totals diverge and Razorpay amount mismatches.
2. **`PUT /api/cart/:cid` ignores `:cid`** (controller reads `productId` from body; FE sends literal `/cart/ignore`). New cart features must keep this quirk or add a NEW route — changing the signature breaks Cart page qty updates.
3. **Product slug auto-generation** (`pre-validate: name-slug + Date.now().toString(36)`) + `GET /products/:pid` accepts id-or-slug. New SEO/slug logic must preserve both lookups; unique-sparse variant SKUs also collide easily on CSV import.
4. **Admin status transitions are allow-listed** (`storeConfig.orderStatusTransitions`; validator excludes `placed`/`rejected`). New statuses (e.g. return flows) require touching BOTH the map and `updateOrderStatusSchema` — easy to desync FE timeline (`ORDER_TIMELINE` in `site.js`) from BE enum.
5. **Auth is a single `isAdmin` boolean + bare JWT in localStorage** with 401-interceptor redirect. New roles/middleware or token-shape changes break `Guards.jsx`, `AuthContext`, and every `forAdmin` route.
6. **Images are Cloudinary-coupled** (`upload.array("images",5)`, 5 MB, jpeg/png/webp, folder `shree/products`, primary-image hook). New galleries/banners reusing this must handle missing Cloudinary env (warn-only) and the `removeImages` URL-or-publicId convention, else product updates orphan/delete wrong assets.
7. **Stale-order job + webhook race** (`staleOrders` cancels placed+pending Razorpay orders after 30 min; webhook marks paid). New payment methods/gift flows must set `payment.status/method` consistently or orders get auto-cancelled under the user.
8. **No destructive ops allowed**: `seed.js` does `deleteMany + insertMany` by SKU and `deleteCoupon` hard-deletes when unused — never run seed against prod; additive migrations must keep old docs valid (optional fields/defaults only).
9. **FE has no shared API service layer or store** (per-page `api.*` calls, local state, no tests). New endpoints must reuse `api/client.js` interceptors; changing `API_BASE`, `TOKEN_KEY`, or response shapes breaks all pages at once.
10. **Rate limits + 100 kb body cap + file count cap** (`apiLimiter 300/15min`, `authLimiter 30/15min`, `express.json 100kb`, multer 5 files). CSV/bulk uploads, reports, and CMS image sets will hit these unless new routes get their own limits.
11. **Legal/About/CMS content is hardcoded** (HERO_SLIDES, tiles, Legal.jsx, Footer links; "About" → `/privacy`). Adding CMS must NOT change existing routes/text — add new models/routes/pages and migrate gradually.
12. **Design-token drift**: AGENTS.md palette ≠ `index.css` `@theme` values. New UI must use existing CSS vars (`bg-bg`, `text-text`, `bg-primary` etc.), not hardcode AGENTS.md hex, or the theme splits.
