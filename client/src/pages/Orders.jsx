import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { ORDER_TIMELINE, TERMINAL_STATUS } from "../config/site.js";
import { Badge, EmptyState, ErrorState, Loader, btnPrimary } from "../components/ui.jsx";

export const StatusTimeline = ({ status }) => {
  if (TERMINAL_STATUS.includes(status)) {
    return (
      <div className="mt-2">
        <Badge>{status.toUpperCase()}</Badge>
      </div>
    );
  }
  const idx = ORDER_TIMELINE.indexOf(status);
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs font-bold">
      {ORDER_TIMELINE.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span className={`rounded-full px-2.5 py-1 ${i <= idx ? "bg-primary text-text" : "bg-primary-soft/50 text-text"}`}>
            {s}
          </span>
          {i < ORDER_TIMELINE.length - 1 && <span>→</span>}
        </li>
      ))}
    </ol>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => {
        setOrders(data || []);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  }, []);

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!orders.length)
    return (
      <EmptyState
        title="No orders yet"
        hint="Your happy parcels will appear here."
        action={<Link to="/products" className={btnPrimary + " mt-4 inline-block"}>Shop now</Link>}
      />
    );

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">My orders</h1>
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <Link key={o._id} to={`/orders/${o._id}`} className="block rounded-2xl bg-surface p-4 shadow hover:shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-text">#{String(o._id).slice(-8).toUpperCase()}</span>
              <Badge>{o.status}</Badge>
              <Badge tone="sand">{o.payment?.method === "cod" ? "COD" : "Prepaid"}</Badge>
              <span className="ml-auto font-extrabold text-text">₹{o.totalAmount}</span>
            </div>
            <p className="mt-1 text-sm text-text">
              {(o.items || []).map((i) => `${i.productSnapshot?.name || "Item"} × ${i.qty}`).join(", ")}
            </p>
            <StatusTimeline status={o.status} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Orders;
