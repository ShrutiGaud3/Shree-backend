import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api, { apiError } from "../api/client.js";
import { EmptyState, ErrorState, Loader, btnPrimary } from "../components/ui.jsx";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = () => {
    setState("loading");
    api
      .get("/cart")
      .then(({ data }) => {
        setCart(data);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  };

  useEffect(load, []);

  const setQty = async (item, qty) => {
    try {
      const { data } = await api.put("/cart/ignore", {
        productId: item.product._id,
        qty,
        ...(item.variant?.sku ? { variantSku: item.variant.sku } : {}),
      });
      setCart(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async (item) => {
    try {
      const q = item.variant?.sku ? `?variantSku=${item.variant.sku}` : "";
      const { data } = await api.delete(`/cart/${item.product._id}${q}`);
      setCart(data);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + (i.variant?.price || i.product?.price || 0) * i.qty, 0);

  if (!items.length)
    return (
      <EmptyState
        title="Your cart is empty"
        hint="Cute toys and shiny things await!"
        action={<Link to="/products" className={btnPrimary + " mt-4 inline-block"}>Start shopping</Link>}
      />
    );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-3 md:col-span-2">
        {items.map((i, idx) => (
          <div key={idx} className="flex gap-3 rounded-2xl bg-surface p-3 shadow">
            <img
              src={i.product?.images?.[0]?.url}
              alt={i.product?.name}
              className="h-20 w-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <Link to={`/products/${i.product?.slug || i.product?._id}`} className="font-bold text-text">
                {i.product?.name}
              </Link>
              {i.variant?.label && <p className="text-sm text-text">{i.variant.label}</p>}
              <p className="font-extrabold text-text">₹{i.variant?.price || i.product?.price}</p>
              <div className="mt-1 flex items-center gap-2">
                <button onClick={() => i.qty > 1 && setQty(i, i.qty - 1)} className="rounded-full border-2 border-accent px-2.5 font-bold">−</button>
                <span className="font-bold">{i.qty}</span>
                <button onClick={() => setQty(i, i.qty + 1)} className="rounded-full border-2 border-accent px-2.5 font-bold">+</button>
                <button onClick={() => remove(i)} className="ml-2 text-sm font-bold text-red-700">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-fit rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">Bill</h2>
        <p className="mt-2 flex justify-between text-text"><span>Subtotal</span><b>₹{subtotal}</b></p>
        <p className="text-sm text-text">Shipping + GST calculated at checkout.</p>
        <Link to="/checkout" className={btnPrimary + " mt-4 block text-center"}>Checkout →</Link>
      </div>
    </div>
  );
};

export default Cart;
