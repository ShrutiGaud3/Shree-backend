import { STORE_NAME } from "../config/site.js";

const Page = ({ title, children }) => (
  <div className="mx-auto max-w-3xl rounded-2xl bg-surface p-6 shadow md:p-8">
    <h1 className="font-display text-3xl font-extrabold text-text">{title}</h1>
    <div className="prose-shree mt-4 space-y-3 text-text">{children}</div>
  </div>
);

export const Privacy = () => (
  <Page title="Privacy Policy">
    <p>Last updated: 2026. {STORE_NAME} ("we") sells toys and jewellery across India through this store.</p>
    <h3 className="font-display text-xl font-bold">What we collect</h3>
    <p>Account details (name, email, phone), delivery addresses, order history, cart contents, product reviews, and support chats. Payments are processed by Razorpay — we never see or store your card/UPI credentials.</p>
    <h3 className="font-display text-xl font-bold">How we use it</h3>
    <p>To fulfil orders, compute shipping/tax, prevent fraud, run the {STORE_NAME} Assistant chatbot, and send order + password-reset emails. We do not sell your data.</p>
    <h3 className="font-display text-xl font-bold">Your rights</h3>
    <p>Ask for a copy or deletion of your data any time via the Contact page. Marketing (if any) is opt-in.</p>
  </Page>
);

export const Terms = () => (
  <Page title="Terms of Service">
    <p>By shopping at {STORE_NAME} you agree to these terms.</p>
    <h3 className="font-display text-xl font-bold">Prices & payment</h3>
    <p>All prices are in INR and inclusive of GST (rate shown per product). Totals are computed server-side. COD is available only for orders below ₹5,000; higher-value orders must be prepaid online.</p>
    <h3 className="font-display text-xl font-bold">Stock</h3>
    <p>Stock is reserved at checkout; unpaid online orders auto-cancel after 30 minutes and stock is released.</p>
    <h3 className="font-display text-xl font-bold">Accounts</h3>
    <p>You are responsible for your account credentials. We may block accounts involved in fraud or abuse.</p>
  </Page>
);

export const Refunds = () => (
  <Page title="Refund & Cancellation Policy">
    <h3 className="font-display text-xl font-bold">Cancellation</h3>
    <p>Cancel free of charge while your order is Placed, Confirmed or Processing (from My Orders). Prepaid amounts are refunded to the original payment method within 5–7 working days.</p>
    <h3 className="font-display text-xl font-bold">Returns</h3>
    <p>Toys marked returnable can be returned within 7 days of delivery in original condition. <b>Jewellery is non-returnable</b> for hygiene and value reasons — please check size/material carefully before ordering.</p>
    <h3 className="font-display text-xl font-bold">Damaged / wrong item</h3>
    <p>Share an unboxing photo within 48 hours via Contact and we will replace or refund, including shipping.</p>
  </Page>
);

export const Shipping = () => (
  <Page title="Shipping Information">
    <p>We ship across India.</p>
    <h3 className="font-display text-xl font-bold">Fees & timelines</h3>
    <p>Orders above ₹999 ship <b>FREE</b>; otherwise a flat ₹99 applies. Dispatch in 1–2 working days; delivery in 3–7 working days depending on pincode.</p>
    <h3 className="font-display text-xl font-bold">Tracking</h3>
    <p>Tracking IDs appear on your order page and in shipping emails once dispatched.</p>
  </Page>
);

export const Contact = () => (
  <Page title="Contact Us">
    <p>We'd love to hear from you! 💌</p>
    <p><b>Email:</b> support@shree.in<br /><b>Hours:</b> Mon–Sat, 10am–7pm IST</p>
    <p>For order help, mention your 8-character order ID (e.g. from My Orders). Try the {STORE_NAME} Assistant chat for instant toy & jewellery suggestions!</p>
  </Page>
);
