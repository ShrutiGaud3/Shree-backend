import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";
import { STORE_NAME } from "../config/site.js";
import { Field, btnPrimary, inputCls } from "../components/ui.jsx";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success(`Welcome back to ${STORE_NAME}!`);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      toast.error(apiError(err, "Invalid credentials"));
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-surface p-6 shadow">
      <h1 className="font-display text-3xl font-extrabold text-text">Login</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Email">
          <input type="email" required className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input type="password" required className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button disabled={loading} className={btnPrimary + " w-full"}>{loading ? "Logging in…" : "Login"}</button>
      </form>
      <div className="mt-3 flex justify-between text-sm font-bold text-text">
        <Link to="/forgot-password" className="underline">Forgot password?</Link>
        <Link to="/register" className="underline">New here? Join</Link>
      </div>
    </div>
  );
};

export default Login;
