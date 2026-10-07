import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";
import { STORE_NAME } from "../config/site.js";
import { Field, btnPrimary, inputCls } from "../components/ui.jsx";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success(`Welcome to ${STORE_NAME}! 🎉`);
      navigate("/");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-surface p-6 shadow">
      <h1 className="font-display text-3xl font-extrabold text-text">Join {STORE_NAME}</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Name">
          <input required minLength="2" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" required className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Mobile (10-digit)">
          <input required pattern="[6-9][0-9]{9}" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Password (min 8 chars)">
          <input type="password" required minLength="8" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button disabled={loading} className={btnPrimary + " w-full"}>{loading ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-3 text-sm font-bold text-text">Already a member? <Link to="/login" className="underline">Login</Link></p>
    </div>
  );
};

export default Register;
