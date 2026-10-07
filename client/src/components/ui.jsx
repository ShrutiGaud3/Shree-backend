// Shared UI primitives — all colors via theme tokens, never hardcoded hex.

export const Loader = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-text">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    <p className="font-semibold">{label}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center shadow">
    <p className="text-4xl">🧸</p>
    <p className="mt-3 font-bold text-text">Oops! {message || "Something went wrong."}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 rounded-full bg-primary px-6 py-2 font-bold text-text shadow hover:bg-primary-soft"
      >
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title, hint, action }) => (
  <div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center shadow">
    <p className="text-4xl">🎁</p>
    <p className="mt-3 text-lg font-bold text-text">{title}</p>
    {hint && <p className="mt-1 text-text">{hint}</p>}
    {action}
  </div>
);

export const Stars = ({ value = 0 }) => (
  <span className="text-accent" aria-label={`${value} out of 5 stars`}>
    {"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}
  </span>
);

export const Badge = ({ children, tone = "pink" }) => (
  <span
    className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold text-text ${
      tone === "pink" ? "bg-primary-soft" : "border border-accent bg-bg"
    }`}
  >
    {children}
  </span>
);

export const Price = ({ price, mrp, big }) => (
  <span className="flex items-baseline gap-2">
    <span className={`font-extrabold text-text ${big ? "text-3xl" : "text-lg"}`}>₹{price}</span>
    {mrp > price && (
      <>
        <span className="text-sm text-text line-through">₹{mrp}</span>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-text">
          {Math.round(((mrp - price) / mrp) * 100)}% off
        </span>
      </>
    )}
  </span>
);

export const SectionTitle = ({ title, sub }) => (
  <div className="mb-5 text-center">
    <h2 className="font-display text-3xl font-extrabold text-text">{title}</h2>
    {sub && <p className="mt-1 text-text">{sub}</p>}
  </div>
);

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-bold text-text">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-text">{hint}</span>}
  </label>
);

export const inputCls =
  "w-full rounded-2xl border-2 border-accent/60 bg-surface px-4 py-2.5 text-text placeholder:text-text-muted outline-none focus:border-accent";

export const btnPrimary =
  "rounded-full bg-primary px-6 py-2.5 font-bold text-text shadow hover:bg-primary-soft disabled:opacity-50";

export const btnSecondary =
  "rounded-full border-2 border-accent bg-bg px-6 py-2.5 font-bold text-text shadow-sm hover:bg-surface disabled:opacity-50";
