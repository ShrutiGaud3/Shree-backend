# Shree — Toys & Jewellery (Single-Vendor Store, India)

**Shree** is a production-ready single-vendor online store selling **toys** and **jewellery** across India.
Backend: **Express 5 + MongoDB (Mongoose) + JWT + Cloudinary + Gemini + Razorpay**, ES Modules.
The store name lives in exactly one backend place (`STORE_NAME` in `server/config/storeConfig.js`).

- Categories: `toys` (soft-toys, board-games, rc-cars, educational) and `jewellery`
  (necklace, earrings, rings, bangles, anklets) — see `server/config/categories.js`.
- Checkout: GST per line item from `product.gstRate`, free shipping above a
  configurable threshold, COD only below a configurable max, store-wide coupons,
  atomic stock reserve (variant-aware), Razorpay create/verify/webhook + refund,
  auto-cancel of stale unpaid orders.
- Page title format: `Shree | Toys & Jewellery`. Chatbot persona: **Shree Assistant**.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in secrets (Windows: copy .env.example .env)
npm run seed           # 1 admin user + 10 toys + 10 jewellery
npm run dev            # watch mode  |  npm start  (prod)
```

Seeded admin: `admin@shree.in` (password: `SEED_ADMIN_PASSWORD` or default `Shree@12345` — change it).

## .env example

```bash
# Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug

# CORS (comma-separated; unset = allow all in dev)
CORS_ORIGIN=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
RATE_LIMIT_AUTH_MAX=30

# Database
MONGO_URI=mongodb://127.0.0.1:27017/shree

# Auth
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary (product images: memory storage, jpg/png/webp, 5MB x 5)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Gemini (Shree Assistant chatbot)
GEMINI_API_KEY=your_gemini_api_key

# Email (order + password-reset mail; skipped gracefully when unset)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=support@shree.in

# Frontend (password-reset links)
FRONTEND_URL=http://localhost:5173

# Razorpay (online payments + refunds + webhooks)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Seed overrides (optional)
SEED_ADMIN_EMAIL=admin@shree.in
SEED_ADMIN_PASSWORD=change-me
SEED_ADMIN_PHONE=9876543210

# Jobs
DISABLE_STALE_ORDER_JOB=false
```

## API + curl examples

Set `BASE=http://localhost:8080` and (after login) `TOKEN=<jwt>`. Auth header: `-H "Authorization: Bearer $TOKEN"`.

### Meta

```bash
curl $BASE/
curl $BASE/api/health
# {"success":true,"store":"Shree","status":"ok","time":"...","uptimeSec":12,"db":"connected"}
```

### Auth — `/api/auth`

```bash
# Register
curl -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.in","phone":"9876543210","password":"password123"}'

# Login
curl -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"asha@example.in","password":"password123"}'

# Forgot password (always 200 — no user enumeration)
curl -X POST $BASE/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"email":"asha@example.in"}'

# Reset password (token = 64-hex from the emailed link)
curl -X POST $BASE/api/auth/reset-password/<64-hex-token> -H "Content-Type: application/json" \
  -d '{"password":"newpassword123"}'

# Private ping (auth)
curl -X POST $BASE/api/auth/private -H "Authorization: Bearer $TOKEN"
```

### Products — `/api/products`

```bash
# Catalog: q, category, subCategory, minPrice, maxPrice, ageGroup, material,
#          sort=price_asc|price_desc|newest|rating, page, limit
curl "$BASE/api/products?category=toys&subCategory=soft-toys&maxPrice=1000&sort=price_asc&page=1&limit=12"
curl "$BASE/api/products?q=necklace&material=silver-925"
curl "$BASE/api/products?category=toys&ageGroup=3-6"
# {"items":[...],"page":1,"totalPages":3,"total":30}

# Detail (by id or slug; inactive -> 404)
curl $BASE/api/products/<id-or-slug>

# Text-search alias
curl $BASE/api/products/search/teddy
```

### Reviews — nested + top-level

```bash
curl $BASE/api/products/<pid>/review/
curl -X POST $BASE/api/products/<pid>/review/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"rating":5,"title":"Loved it","text":"Soft, safe and fast delivery."}'

curl $BASE/api/reviews/?product=<pid>            # same controller (query variant)
curl -X DELETE $BASE/api/reviews/<rid> -H "Authorization: Bearer $TOKEN"  # owner or admin
```

### Cart — `/api/cart` (auth)

```bash
curl $BASE/api/cart -H "Authorization: Bearer $TOKEN"
curl -X POST $BASE/api/cart -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":"<pid>","qty":2}'
# variant product:
curl -X POST $BASE/api/cart -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":"<pid>","qty":1,"variantSku":"SHREE-JWL-005-S12"}'
curl -X PUT $BASE/api/cart/ignore -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":"<pid>","qty":3}'
curl -X DELETE "$BASE/api/cart/<pid>?variantSku=SHREE-JWL-005-S12" -H "Authorization: Bearer $TOKEN"
curl -X POST $BASE/api/cart/clear -H "Authorization: Bearer $TOKEN"
```

### Orders — `/api/orders` (auth)

```bash
curl $BASE/api/orders -H "Authorization: Bearer $TOKEN"
curl $BASE/api/orders/<oid> -H "Authorization: Bearer $TOKEN"

# Checkout (totals/GST/shipping always recomputed server-side)
curl -X POST $BASE/api/orders -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "shippingAddress": {"name":"Asha","phone":"9876543210","line1":"12 MG Road","city":"Indore","state":"MP","pincode":"452001"},
  "couponCode": "WELCOME10",
  "paymentMethod": "cod"
}'
# paymentMethod "razorpay" -> {"order":{...},"razorpay":{"orderId":"order_...","amount":...,"keyId":"...","name":"Shree"}}

# Cancel my order (placed/confirmed/processing only; paid online -> auto-refund)
curl -X PUT $BASE/api/orders/<oid> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reason":"Changed my mind"}'
```

### Payments — `/api/payments`

```bash
# Publishable key for checkout.js
curl $BASE/api/payments/key

# Verify after checkout.js success (auth + ownership)
curl -X POST $BASE/api/payments/verify -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "orderId":"<mongo-order-id>",
  "razorpayOrderId":"order_...",
  "razorpayPaymentId":"pay_...",
  "razorpaySignature":"..."
}'

# Webhook (Razorpay -> server; raw body + signature header, no JWT)
curl -X POST $BASE/api/payments/webhook -H "Content-Type: application/json" \
  -H "x-razorpay-signature: <hmac-of-raw-body>" -d '{"event":"payment.captured",...}'
```

### Coupons — `/api/coupons`

```bash
curl $BASE/api/coupons
curl -X POST $BASE/api/coupons/apply -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"couponCode":"WELCOME10","orderValue":1500}'
```

### Chat — `/api/chat` (auth, Shree Assistant)

```bash
curl -X POST $BASE/api/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"question":"Gift for a 5 year old under 1000?"}'
```

### Admin — `/api/admin` (`isAdmin` JWT)

```bash
A='-H "Authorization: Bearer $ADMIN_TOKEN"'
curl $BASE/api/admin/dashboard $A            # today revenue/orders, totals, status split, low-stock
curl $BASE/api/admin/users $A
curl -X PUT $BASE/api/admin/users/<uid> $A -H "Content-Type: application/json" -d '{"isBlocked":true}'
curl $BASE/api/admin/orders $A
curl -X PUT $BASE/api/admin/orders/<oid> $A -H "Content-Type: application/json" \
  -d '{"status":"shipped","note":"Via Delhivery"}'   # transition-map enforced; COD delivered -> paid

# Products (JSON or multipart "images" up to 5 x jpg/png/webp)
curl $BASE/api/admin/products $A
curl -X POST $BASE/api/admin/products $A -H "Content-Type: application/json" -d '{
  "name":"Demo Teddy","description":"A very soft demo teddy bear for testing.",
  "category":"toys","subCategory":"soft-toys","sku":"DEMO-001",
  "mrp":499,"price":399,"stock":10,"toysFields":{"ageGroup":"3-6"}}'
curl -X POST $BASE/api/admin/products $A -F "name=Demo Teddy" -F "description=A very soft demo teddy bear." \
  -F "category=toys" -F "subCategory=soft-toys" -F "sku=DEMO-001" -F "mrp=499" -F "price=399" -F "stock=10" \
  -F "images=@teddy1.jpg" -F "images=@teddy2.webp"
curl -X PUT $BASE/api/admin/products/<pid> $A -H "Content-Type: application/json" \
  -d '{"price":349,"removeImages":["<cloudinary-public-id>"]}'
curl -X DELETE $BASE/api/admin/products/<pid> $A     # soft delete (PUT isActive:true restores)

# Coupons
curl $BASE/api/admin/coupons $A
curl -X POST $BASE/api/admin/coupons $A -H "Content-Type: application/json" -d '{
  "code":"WELCOME10","discountType":"percentage","discountValue":10,"maxDiscount":200,
  "minOrderValue":499,"applicableCategory":"all","expiresAt":"2027-03-31T23:59:59.000Z"}'
curl -X PUT $BASE/api/admin/coupons/<cid> $A -H "Content-Type: application/json" -d '{"isActive":false}'
curl -X DELETE $BASE/api/admin/coupons/<cid> $A      # unused -> delete, redeemed -> deactivate
```

## Notes

- Money is computed server-side from DB prices + `gstRate`; frontend amounts are never trusted.
- Every user-owned query filters by `req.user._id`; admin-only routes return 401/403 otherwise.
- Validation errors are 400 (zod), bad ids 404 (CastError), duplicates 409 (11000).
- Unpaid Razorpay orders auto-cancel after `staleOrderMinutes` (default 30) and release stock.
- Emails (order + reset) send via SMTP when configured, otherwise skipped with a log line.
