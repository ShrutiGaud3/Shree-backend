import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { CATEGORIES, SORT_OPTIONS } from "../config/site.js";
import ProductCard from "../components/ProductCard.jsx";
import { EmptyState, ErrorState, Field, Loader, inputCls } from "../components/ui.jsx";

const Products = () => {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], page: 1, totalPages: 0, total: 0 });
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const q = useMemo(
    () => ({
      q: params.get("q") || "",
      category: params.get("category") || "",
      subCategory: params.get("subCategory") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      ageGroup: params.get("ageGroup") || "",
      material: params.get("material") || "",
      sort: params.get("sort") || "newest",
      page: params.get("page") || "1",
    }),
    [params]
  );

  useEffect(() => {
    setState("loading");
    const clean = Object.fromEntries(Object.entries({ ...q, limit: "12" }).filter(([, v]) => v !== ""));
    api
      .get("/products", { params: clean })
      .then(({ data }) => {
        setData(data);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!patch.page) next.delete("page");
    setParams(next);
  };

  const subOptions = q.category ? CATEGORIES[q.category]?.subCategories || {} : {};

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">
        {q.category ? CATEGORIES[q.category]?.label : "All products"}
        <span className="ml-2 text-base font-bold">({data.total})</span>
      </h1>

      {/* Filters */}
      <div className="mt-4 grid gap-3 rounded-2xl bg-surface p-4 shadow sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Search">
          <input className={inputCls} value={q.q} placeholder="teddy, necklace…" onChange={(e) => set({ q: e.target.value })} />
        </Field>
        <Field label="Category">
          <select className={inputCls} value={q.category} onChange={(e) => set({ category: e.target.value, subCategory: "" })}>
            <option value="">All</option>
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <option key={k} value={k}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Sub-category">
          <select className={inputCls} value={q.subCategory} onChange={(e) => set({ subCategory: e.target.value })} disabled={!q.category}>
            <option value="">All</option>
            {Object.entries(subOptions).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Min ₹">
          <input className={inputCls} type="number" min="0" value={q.minPrice} onChange={(e) => set({ minPrice: e.target.value })} />
        </Field>
        <Field label="Max ₹">
          <input className={inputCls} type="number" min="0" value={q.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} />
        </Field>
        <Field label="Sort">
          <select className={inputCls} value={q.sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        {q.category === "toys" && (
          <Field label="Age group">
            <select className={inputCls} value={q.ageGroup} onChange={(e) => set({ ageGroup: e.target.value })}>
              <option value="">All</option>
              {["0-3", "3-6", "6-12", "12+"].map((a) => (
                <option key={a} value={a}>{a} yrs</option>
              ))}
            </select>
          </Field>
        )}
        {q.category === "jewellery" && (
          <Field label="Material">
            <select className={inputCls} value={q.material} onChange={(e) => set({ material: e.target.value })}>
              <option value="">All</option>
              {["gold-plated", "silver-925", "artificial", "platinum-plated", "rose-gold-plated", "brass", "copper"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {/* Results */}
      <div className="mt-5">
        {state === "loading" && <Loader />}
        {state === "error" && <ErrorState message={error} onRetry={() => window.location.reload()} />}
        {state === "done" && data.items.length === 0 && (
          <EmptyState title="No matches" hint="Try a different search or clear the filters." />
        )}
        {state === "done" && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 font-bold text-text">
              <button
                disabled={data.page <= 1}
                onClick={() => set({ page: String(data.page - 1) })}
                className="rounded-full border-2 border-accent px-5 py-1.5 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span>Page {data.page} of {Math.max(data.totalPages, 1)}</span>
              <button
                disabled={data.page >= data.totalPages}
                onClick={() => set({ page: String(data.page + 1) })}
                className="rounded-full border-2 border-accent px-5 py-1.5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
