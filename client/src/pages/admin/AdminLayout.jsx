import { Link, NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => (
  <div className="grid gap-5 md:grid-cols-[200px_1fr]">
    <aside className="h-fit rounded-2xl bg-surface p-4 shadow">
      <p className="font-display text-xl font-extrabold text-text">Admin</p>
      <nav className="mt-2 flex flex-row flex-wrap gap-2 font-bold text-text md:flex-col">
        {[
          ["/admin", "Dashboard"],
          ["/admin/products", "Products"],
          ["/admin/orders", "Orders"],
          ["/admin/coupons", "Coupons"],
          ["/admin/users", "Users"],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) => `rounded-full px-4 py-1.5 ${isActive ? "bg-primary" : "bg-bg hover:bg-primary-soft"}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Link to="/" className="mt-3 block text-sm font-bold text-text underline">← Back to store</Link>
    </aside>
    <div>
      <Outlet />
    </div>
  </div>
);

export default AdminLayout;
