import { useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { STORE_NAME } from "../config/site.js";
import { Loader, btnPrimary, inputCls } from "../components/ui.jsx";

const SUGGESTIONS = [
  "Gift for a 5 year old under ₹1000?",
  "Silver earrings for daily wear?",
  "Board games for family night?",
];

const Chat = () => {
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hi! I'm ${STORE_NAME} Assistant 🎁 Ask me about toys or jewellery!` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (q) => {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: question }]);
    setBusy(true);
    try {
      const { data } = await api.post("/chat", { question });
      setMessages((m) => [...m, { from: "bot", text: data.message }]);
    } catch (e) {
      const status = e.response?.status;
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: status === 401 ? "Please login to chat with me! You can browse products meanwhile. 🧸" : apiError(e),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-surface p-5 shadow">
      <h1 className="font-display text-2xl font-extrabold text-text">{STORE_NAME} Assistant</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full bg-bg px-3 py-1 text-xs font-bold text-text shadow-sm hover:bg-primary-soft">
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-96 space-y-2 overflow-y-auto rounded-2xl bg-bg p-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-semibold ${m.from === "bot" ? "bg-primary-soft text-text" : "ml-auto bg-surface text-text shadow-sm"}`}>
            {m.text}
          </div>
        ))}
        {busy && <Loader label="" />}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-3 flex gap-2">
        <input className={inputCls} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about toys or jewellery…" />
        <button disabled={busy} className={btnPrimary}>Send</button>
      </form>
      <p className="mt-2 text-xs text-text">Tip: <Link to="/products" className="underline">browse the catalog</Link> any time.</p>
    </div>
  );
};

export default Chat;
