import { useState } from "react";
import api, { apiError } from "../api/client.js";
import { Field, btnPrimary, inputCls } from "../components/ui.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(data.message);
    } catch (err) {
      setSent(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-surface p-6 shadow">
      <h1 className="font-display text-3xl font-extrabold text-text">Forgot password?</h1>
      {sent ? (
        <p className="mt-3 font-bold text-text">{sent}</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Field label="Account email">
            <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button disabled={busy} className={btnPrimary + " w-full"}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
