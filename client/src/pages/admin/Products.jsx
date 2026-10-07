import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { apiError } from "../../api/client.js";
import { CATEGORIES } from "../../config/site.js";
import { ErrorState, Field, Loader, btnSecondary, inputCls } from "../../components/ui.jsx";

const emptyForm = {
  name: "", description: "", category: "toys", subCategory: "", brand: "",
  sku: "", mrp: "", price: "", stock: "10", gstRate: "18", isReturnable: true,
  ageGroup: "", batteryRequired: false, material: "",
};

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setState("loading");
    api
      .get("/admin/products")
      .then(({ data }) => {
        setProducts(data || []);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      const payload = { ...form, mrp: Number(form.mrp), price: Number(form.price), stock: Number(form.stock), gstRate: Number(form.gstRate) };
      if (payload.category === "toys") {
        payload.toysFields = JSON.stringify({
          ...(form.ageGroup ? { ageGroup: form.ageGroup } : {}),
          batteryRequired: form.batteryRequired,
        });
      } else {
        payload.jewelleryFields = JSON.stringify({ ...(form.material ? { material: form.material } : {}) });
      }
      delete payload.ageGroup;
      delete payload.batteryRequired;
      delete payload.material;
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== "" && v !== undefined) fd.append(k, typeof v === "boolean" ? String(v) : v);
      });
      [...files].slice(0, 5).forEach((f) => fd.append("images", f));

      if (editing) await api.put(`/admin/products/${editing}`, fd);
      else await api.post("/admin/products", fd);
      toast.success(editing ? "Product updated!" : "Product created!");
      setForm(emptyForm);
      setFiles([]);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name || "", description: p.description || "", category: p.category,
      subCategory: p.subCategory || "", brand: p.brand || "", sku: p.sku || "",
      mrp: p.mrp ?? "", price: p.price ?? "", stock: p.stock ?? "10",
      gstRate: p.gstRate ?? "18", isReturnable: p.isReturnable ?? true,
      ageGroup: p.toysFields?.ageGroup || "", batteryRequired: !!p.toysFields?.batteryRequired,
      material: p.jewelleryFields?.material || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deactivate = async (p) => {
    if (!window.confirm(`${p.isActive ? "Deactivate" : "Re-activate"} ${p.name}?`)) return;
    try {
      if (p.isActive) await api.delete(`/admin/products/${p._id}`);
      else await api.put(`/admin/products/${p._id}`, { isActive: true });
      toast.success("Done!");
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  const subs = CATEGORIES[form.category]?.subCategories || {};

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">Products ({products.length})</h1>

      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">{editing ? "Edit product" : "Add product"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="SKU"><input required className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
        </div>
        <Field label="Description (min 10 chars)"><textarea required rows="2" className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "" })}>
              {Object.keys(CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Sub-category">
            <select required className={inputCls} value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })}>
              <option value="">—</option>
              {Object.entries(subs).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="MRP ₹"><input required type="number" min="0" className={inputCls} value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></Field>
          <Field label="Price ₹"><input required type="number" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Stock"><input required type="number" min="0" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
          <Field label="GST %"><input type="number" min="0" max="100" className={inputCls} value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} /></Field>
          <Field label="Brand"><input className={inputCls} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Images (≤5)"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(e.target.files)} /></Field>
        </div>
        {form.category === "toys" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age group">
              <select className={inputCls} value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                <option value="">—</option>
                {["0-3", "3-6", "6-12", "12+"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 font-bold text-text">
              <input type="checkbox" checked={form.batteryRequired} onChange={(e) => setForm({ ...form, batteryRequired: e.target.checked })} /> Battery required
            </label>
          </div>
        ) : (
          <Field label="Material">
            <select className={inputCls} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
              <option value="">—</option>
              {["gold-plated", "silver-925", "artificial", "platinum-plated", "rose-gold-plated", "brass", "copper"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        )}
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-full bg-primary px-6 py-2.5 font-bold text-text shadow">{busy ? "Saving…" : editing ? "Update" : "Create"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="font-bold text-text underline">Cancel</button>}
        </div>
      </form>

      <div className="mt-4 space-y-2">
        {products.map((p) => (
          <div key={p._id} className={`flex items-center gap-3 rounded-2xl bg-surface p-3 shadow ${p.isActive ? "" : "opacity-60"}`}>
            {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
            <div className="flex-1 text-sm">
              <p className="font-bold text-text">{p.name}</p>
              <p className="text-text">{p.sku} · {p.category}/{p.subCategory} · ₹{p.price} · stock {p.stock}</p>
            </div>
            <button onClick={() => startEdit(p)} className={btnSecondary + " px-4 py-1 text-sm"}>Edit</button>
            <button onClick={() => deactivate(p)} className="text-sm font-bold text-red-700 underline">{p.isActive ? "Deactivate" : "Activate"}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsAdmin;
