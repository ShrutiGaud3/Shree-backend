import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { apiError } from "../../api/client.js";
import { Badge, ErrorState, Loader, inputCls } from "../../components/ui.jsx";

const NEXT = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "completed"],
  returned: ["refunded", "rejected"],
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});

  const load = () => {
    setState("loading");
    api
      .get("/admin/orders")
      .then(({ data }) => {
        setOrders(data || []);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  };

  useEffect(load, []);

  const transition = async (o, status) => {
    try {
      const { data } = await api.put(`/admin/orders/${o._id}`, { status, note: notes[o._id] || "" });
      setOrders(orders.map((x) => (x._id === o._id ? data : x)));
      toast.success(`Order → ${status}`);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">Orders ({orders.length})</h1>
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="rounded-2xl bg-surface p-4 shadow">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-text">#{String(o._id).slice(-8).toUpperCase()}</span>
              <Badge>{o.status}</Badge>
              <Badge tone="sand">{o.payment?.method} · {o.payment?.status}</Badge>
              <span className="ml-auto font-extrabold text-text">₹{o.totalAmount}</span>
            </div>
            <p className="mt-1 text-sm text-text">
              {o.user?.name} · {o.user?.phone} · {(o.items || []).map((i) => `${i.qty}× ${i.product?.name || "item"}`).join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                placeholder="Note (optional)"
                className={inputCls + " max-w-xs"}
                value={notes[o._id] || ""}
                onChange={(e) => setNotes({ ...notes, [o._id]: e.target.value })}
              />
              {(NEXT[o.status] || []).map((s) => (
                <button
                  key={s}
                  onClick={() => transition(o, s)}
                  className={`rounded-full px-4 py-1 text-sm font-bold ${s === "cancelled" ? "border-2 border-red-400 text-red-700" : "bg-primary text-text"}`}
                >
                  → {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-text">No orders yet.</p>}
      </div>
    </div>
  );
};

export default OrdersAdmin;
