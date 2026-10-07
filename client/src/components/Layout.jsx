import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { STORE_NAME } from "../config/site.js";
import { useEffect, useState } from "react";
import api from "../api/client.js";

const Header = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }
    api
      .get("/cart")
      .then(({ data }) => setCartCount((data.items || []).reduce((s, i) => s + i.qty, 0)))
      .catch(() => {});
  }, [isLoggedIn]);

  return (
    <header className="sticky top-0 z-40 bg-surface shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="font-display text-3xl font-extrabold tracking-tight text-text">
          {STORE_NAME}
          <span className="ml-2 hidden rounded-full bg-primary-soft px-2 py-0.5 align-middle text-xs font-bold sm:inline">
            Toys & Jewellery
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-4 font-bold text-text md:flex">
          <NavLink to="/products?category=toys">Toys</NavLink>
          <NavLink to="/products?category=jewellery">Jewellery</NavLink>
          <NavLink to="/products">All</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm font-bold text-text">
          {isLoggedIn ? (
            <>
              <Link to="/orders" className="hidden sm:inline">Orders</Link>
              <Link to="/account" className="hidden sm:inline">{user?.name?.split(" ")[0]}</Link>
              <Link to="/cart" className="rounded-full bg-primary px-4 py-1.5">🛒 {cartCount}</Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full border-2 border-accent px-4 py-1"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border-2 border-accent px-4 py-1">Login</Link>
              <Link to="/register" className="rounded-full bg-primary px-4 py-1.5">Join</Link>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 font-bold text-text md:hidden">
        <NavLink to="/products?category=toys">🧸 Toys</NavLink>
        <NavLink to="/products?category=jewellery">💎 Jewellery</NavLink>
        <NavLink to="/products">All</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="mt-12 bg-surface text-text">
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-4">
      <div>
        <p className="font-display text-2xl font-extrabold">{STORE_NAME}</p>
        <p className="mt-1 text-sm">Toys that spark joy, jewellery that shines. Made for India. 🇮🇳</p>
      </div>
      <div className="text-sm font-bold">
        <p className="mb-2">Shop</p>
        <Link className="block py-0.5" to="/products?category=toys">Toys</Link>
        <Link className="block py-0.5" to="/products?category=jewellery">Jewellery</Link>
        <Link className="block py-0.5" to="/products">All products</Link>
      </div>
      <div className="text-sm font-bold">
        <p className="mb-2">Help</p>
        <Link className="block py-0.5" to="/contact">Contact us</Link>
        <Link className="block py-0.5" to="/shipping">Shipping info</Link>
        <Link className="block py-0.5" to="/refunds">Refunds & cancellation</Link>
      </div>
      <div className="text-sm font-bold">
        <p className="mb-2">Legal</p>
        <Link className="block py-0.5" to="/privacy">Privacy policy</Link>
        <Link className="block py-0.5" to="/terms">Terms of service</Link>
      </div>
    </div>
    <p className="border-t-2 border-accent/40 py-3 text-center text-sm">© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</p>
  </footer>
);

const Layout = () => (
  <div className="flex min-h-screen flex-col bg-bg text-text">
    <Header />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;
