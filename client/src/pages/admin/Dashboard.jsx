import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../../api/client.js";
import { ErrorState, Loader } from "../../components/ui.jsx";

const Card = ({ title, value, link, linkLabel }) => (
  <div className="rounded-2xl bg-surface p-5 shadow">
    <p className="text-sm font-bold text-text">{title}</p>
    <p className="font-display text-3xl font-extrabold text-text">{value}</p>
    {link && <Link to={link} className="text-sm font-bold text-text underline">{linkLabel}</Link>}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => {
        setData(data);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  }, []);

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card title="Today's orders" value={data.today.orders} />
        <Card title="Today's revenue" value={`₹${data.today.revenue}`} />
        <Card title="Total revenue" value={`₹${data.totals.revenue}`} />
        <Card title="Total orders" value={data.totals.orders} link="/admin/orders" linkLabel="View orders" />
        <Card title="Customers" value={data.totals.users} link="/admin/users" linkLabel="View users" />
        <Card title="Live products" value={data.totals.activeProducts} link="/admin/products" linkLabel="Manage" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow">
          <h2 className="font-display text-xl font-extrabold text-text">Orders by status</h2>
          <div className="mt-2 space-y-1 text-sm font-bold text-text">
            {Object.entries(data.ordersByStatus || {}).map(([s, c]) => (
              <p key={s} className="flex justify-between"><span>{s}</span><span>{c}</span></p>
            ))}
            {Object.keys(data.ordersByStatus || {}).length === 0 && <p>No orders yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow">
          <h2 className="font-display text-xl font-extrabold text-text">Low stock (≤ {data.lowStockThreshold})</h2>
          <div className="mt-2 space-y-1 text-sm text-text">
            {(data.lowStock || []).map((p) => (
              <p key={p._id} className="flex justify-between gap-2">
                <span className="font-bold">{p.name} <span className="font-normal">({p.sku})</span></span>
                <span className="font-bold">{p.variants?.length ? `${p.variants.length} variants` : `${p.stock} left`}</span>
              </p>
            ))}
            {(data.lowStock || []).length === 0 && <p>All stocked up! ✅</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
