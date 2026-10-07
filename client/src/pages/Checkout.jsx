import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { apiError, loadRazorpay } from "../api/client.js";
import { STORE_NAME, RAZORPAY_THEME_COLOR } from "../config/site.js";
import { Field, Loader, btnPrimary, btnSecondary, inputCls } from "../components/ui.jsx";

const emptyAddr = { label: "home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

const Checkout = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState(emptyAddr);
  const [showForm, setShowForm] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [payMethod, setPayMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/addresses")
      .then(({ data }) => {
        setAddresses(data || []);
        const d = data?.find((a) => a.isDefault) || data?.[0];
        if (d) setSelected(d._id);
        else setShowForm(true);
      })
      .catch(() => setShowForm(true))
      .finally(() => setLoading(false));
  }, []);

  const saveAddress = async (e) => {
    e?.preventDefault();
    try {
      const { data } = await api.post("/auth/addresses", { ...form, isDefault: addresses.length === 0 });
      setAddresses(data);
      setSelected(data[data.length - 1]._id);
      setShowForm(false);
      setForm(emptyAddr);
      toast.success("Address saved!");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const chosen = addresses.find((a) => a._id === selected);

  const placeOrder = async () => {
    if (!chosen && !showForm) return toast.warn("Please choose or add an address");
    let address = chosen;
    if (showForm) {
      try {
        const { data } = await api.post("/auth/addresses", form);
        address = data[data.length - 1];
      } catch (err) {
        return toast.error(apiError(err, "Please complete the address form"));
      }
    }
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        ...(coupon.trim() ? { couponCode: coupon.trim().toUpperCase() } : {}),
        paymentMethod: payMethod,
      });

      if (payMethod === "razorpay") {
        const ok = await loadRazorpay();
        if (!ok) throw new Error("Could not load Razorpay. Check your connection.");
        const rz = data.razorpay;
        const paid = await new Promise((resolve) => {
          const r = new window.Razorpay({
            key: rz.keyId,
            amount: Math.round(rz.amount * 100),
            currency: "INR",
            name: STORE_NAME,
            description: "Toys & Jewellery",
            order_id: rz.orderId,
            theme: { color: RAZORPAY_THEME_COLOR },
            handler: (resp) => resolve(resp),
            modal: { ondismiss: () => resolve(null) },
          });
          r.open();
        });
        if (!paid) {
          toast.warn("Payment window closed — pay from My Orders within 30 minutes.");
          return navigate("/orders");
        }
        await api.post("/payments/verify", {
          orderId: data.order._id,
          razorpayOrderId: paid.razorpay_order_id,
          razorpayPaymentId: paid.razorpay_payment_id,
          razorpaySignature: paid.razorpay_signature,
        });
        toast.success("Payment successful! 🎉");
        return navigate(`/orders/${data.order._id}`);
      }

      toast.success("Order placed! 🎉");
      navigate(`/orders/${data._id}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">1 · Delivery address</h2>
        {addresses.length > 0 && !showForm && (
          <div className="mt-3 space-y-2">
            {addresses.map((a) => (
              <button
                key={a._id}
                onClick={() => setSelected(a._id)}
                className={`w-full rounded-2xl border-2 p-3 text-left ${selected === a._id ? "border-accent bg-bg" : "border-accent/40"}`}
              >
                <p className="font-bold text-text">{a.name} · {a.phone} {a.isDefault && "(default)"}</p>
                <p className="text-sm text-text">{a.line1}, {a.city}, {a.state} — {a.pincode}</p>
              </button>
            ))}
            <button onClick={() => setShowForm(true)} className="font-bold text-text underline">+ Add new address</button>
          </div>
        )}
        {(showForm || !addresses.length) && (
          <form onSubmit={saveAddress} className="mt-3 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Phone"><input required className={inputCls} pattern="[6-9][0-9]{9}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            </div>
            <Field label="Address line 1"><input required className={inputCls} value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="City"><input required className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="State"><input required className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
              <Field label="Pincode"><input required className={inputCls} pattern="[0-9]{6}" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
            </div>
            <button className={btnSecondary + " w-fit"}>Save address</button>
          </form>
        )}
      </div>

      <div className="h-fit rounded-2xl bg-surface p-5 shadow">
        <h2 className="font-display text-xl font-extrabold text-text">2 · Coupon & payment</h2>
        <Field label="Coupon code (optional)">
          <input className={inputCls + " uppercase"} value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="WELCOME10" />
        </Field>
        <p className="mt-3 font-bold text-text">Payment</p>
        <div className="mt-1 space-y-2">
          <label className="flex items-center gap-2 rounded-2xl border-2 border-accent/50 bg-bg p-3 font-bold text-text">
            <input type="radio" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} />
            Cash on Delivery (orders below ₹5,000)
          </label>
          <label className="flex items-center gap-2 rounded-2xl border-2 border-accent/50 bg-bg p-3 font-bold text-text">
            <input type="radio" checked={payMethod === "razorpay"} onChange={() => setPayMethod("razorpay")} />
            Pay online (UPI / card — Razorpay)
          </label>
        </div>
        <button onClick={placeOrder} disabled={placing} className={btnPrimary + " mt-4 w-full"}>
          {placing ? "Placing order…" : payMethod === "cod" ? "Place COD order" : "Pay & place order"}
        </button>
        <p className="mt-2 text-xs text-text">GST + shipping are computed server-side. Jewellery is non-returnable.</p>
      </div>
    </div>
  );
};

export default Checkout;
