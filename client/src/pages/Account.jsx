import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { apiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Field, Loader, btnSecondary, inputCls } from "../components/ui.jsx";

const emptyAddr = { label: "home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

const Account = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAddr);
  const [editing, setEditing] = useState(null);

  const load = () =>
    api
      .get("/auth/addresses")
      .then(({ data }) => setAddresses(data || []))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = editing
        ? await api.put(`/auth/addresses/${editing}`, form)
        : await api.post("/auth/addresses", form);
      setAddresses(data);
      setForm(emptyAddr);
      setEditing(null);
      toast.success("Address saved!");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const { data } = await api.delete(`/auth/addresses/${id}`);
      setAddresses(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-text">Hi, {user?.name}! 👋</h1>
        <p className="text-text">{user?.email} · {user?.phone}</p>
        <h2 className="font-display mt-5 text-xl font-extrabold text-text">Saved addresses</h2>
        <div className="mt-2 space-y-2">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-2xl bg-surface p-3 shadow">
              <p className="font-bold text-text">{a.name} · {a.phone} {a.isDefault && "(default)"}</p>
              <p className="text-sm text-text">{a.line1}, {a.city}, {a.state} — {a.pincode}</p>
              <div className="mt-1 flex gap-3 text-sm font-bold">
                <button
                  onClick={() => { setEditing(a._id); setForm({ ...emptyAddr, ...a }); }}
                  className="text-text underline"
                >
                  Edit
                </button>
                <button onClick={() => remove(a._id)} className="text-red-700 underline">Delete</button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-text">No saved addresses yet.</p>}
        </div>
      </div>
      <form onSubmit={submit} className="h-fit rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">{editing ? "Edit address" : "Add address"}</h2>
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><input required pattern="[6-9][0-9]{9}" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Address line 1"><input required className={inputCls} value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></Field>
          <Field label="Address line 2 (optional)"><input className={inputCls} value={form.line2 || ""} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><input required className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="State"><input required className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="Pincode"><input required pattern="[0-9]{6}" className={inputCls} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 font-bold text-text">
            <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Make default
          </label>
          <div className="flex gap-2">
            <button className={btnSecondary}>{editing ? "Update" : "Save"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyAddr); }} className="font-bold text-text underline">Cancel</button>}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Account;
