import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { Field, btnPrimary, inputCls } from "../components/ui.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      alert(data.message);
      navigate("/login");
    } catch (err) {
      alert(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-surface p-6 shadow">
      <h1 className="font-display text-3xl font-extrabold text-text">Set new password</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="New password (min 8 chars)">
          <input type="password" required minLength="8" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button disabled={busy} className={btnPrimary + " w-full"}>{busy ? "Saving…" : "Reset password"}</button>
      </form>
      <p className="mt-3 text-sm font-bold text-text"><Link to="/login" className="underline">Back to login</Link></p>
    </div>
  );
};

export default ResetPassword;
