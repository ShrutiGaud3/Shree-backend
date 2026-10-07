import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { apiError } from "../../api/client.js";
import { ErrorState, Field, Loader, inputCls } from "../../components/ui.jsx";

const emptyForm = {
  code: "", description: "", discountType: "percentage", discountValue: "",
  maxDiscount: "", minOrderValue: "0", applicableCategory: "all",
  usageLimit: "0", perUserLimit: "1", expiresAt: "",
};

const CouponsAdmin = () => {
  const [coupons, setCoupons] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setState("loading");
    api
      .get("/admin/coupons")
      .then(({ data }) => {
        setCoupons(data || []);
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
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue || 0),
        perUserLimit: Number(form.perUserLimit || 1),
        usageLimit: Number(form.usageLimit || 0),
        ...(form.maxDiscount !== "" ? { maxDiscount: Number(form.maxDiscount) } : {}),
      };
      if (editing) await api.put(`/admin/coupons/${editing}`, payload);
      else await api.post("/admin/coupons", payload);
      toast.success(editing ? "Coupon updated!" : "Coupon created!");
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.code}? (redeemed coupons are deactivated instead)`)) return;
    try {
      const { data } = await api.delete(`/admin/coupons/${c._id}`);
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">Coupons ({coupons.length})</h1>
      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">{editing ? "Edit coupon" : "New coupon"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Code"><input required className={inputCls + " uppercase"} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">Percentage %</option>
              <option value="fixed">Fixed ₹</option>
            </select>
          </Field>
          <Field label="Value"><input required type="number" min="0" className={inputCls} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></Field>
          <Field label="Max discount ₹"><input type="number" min="0" className={inputCls} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></Field>
          <Field label="Min order ₹"><input type="number" min="0" className={inputCls} value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} /></Field>
          <Field label="Category">
            <select className={inputCls} value={form.applicableCategory} onChange={(e) => setForm({ ...form, applicableCategory: e.target.value })}>
              <option value="all">All</option>
              <option value="toys">Toys</option>
              <option value="jewellery">Jewellery</option>
            </select>
          </Field>
          <Field label="Usage limit (0=∞)"><input type="number" min="0" className={inputCls} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></Field>
          <Field label="Per-user limit"><input type="number" min="1" className={inputCls} value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} /></Field>
          <Field label="Expires at"><input required type="date" className={inputCls} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
        </div>
        <Field label="Description"><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="flex gap-2">
          <button className="rounded-full bg-primary px-6 py-2.5 font-bold text-text shadow">{editing ? "Update" : "Create"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="font-bold text-text underline">Cancel</button>}
        </div>
      </form>
      <div className="mt-4 space-y-2">
        {coupons.map((c) => (
          <div key={c._id} className={`flex items-center gap-3 rounded-2xl bg-surface p-3 shadow ${c.isActive ? "" : "opacity-60"}`}>
            <div className="flex-1 text-sm">
              <p className="font-extrabold text-text">{c.code} {!c.isActive && "(inactive)"}</p>
              <p className="text-text">{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`} · min ₹{c.minOrderValue} · used {c.usedCount}/{c.usageLimit || "∞"} · {c.applicableCategory}</p>
            </div>
            <button onClick={() => { setEditing(c._id); setForm({ ...emptyForm, ...c, expiresAt: c.expiresAt?.slice(0, 10) || "" }); }} className="text-sm font-bold text-text underline">Edit</button>
            <button onClick={() => remove(c)} className="text-sm font-bold text-red-700 underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponsAdmin;
