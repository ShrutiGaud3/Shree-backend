import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { apiError, loadRazorpay } from "../api/client.js";
import { RAZORPAY_THEME_COLOR, STORE_NAME } from "../config/site.js";
import { StatusTimeline } from "./Orders.jsx";
import { Badge, ErrorState, Loader, btnSecondary } from "../components/ui.jsx";

const OrderDetail = () => {
  const { oid } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setState("loading");
    api
      .get(`/orders/${oid}`)
      .then(({ data }) => {
        setOrder(data);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e, "Order not found"));
        setState("error");
      });
  };

  useEffect(load, [oid]); // eslint-disable-line react-hooks/exhaustive-deps

  const payNow = async () => {
    const ok = await loadRazorpay();
    if (!ok) return toast.error("Could not load Razorpay.");
    setBusy(true);
    try {
      const { data: keyData } = await api.get("/payments/key");
      const paid = await new Promise((resolve) => {
        const r = new window.Razorpay({
          key: keyData.keyId,
          amount: Math.round(order.totalAmount * 100),
          currency: "INR",
          name: STORE_NAME,
          order_id: order.payment.razorpayOrderId,
          theme: { color: RAZORPAY_THEME_COLOR },
          handler: (resp) => resolve(resp),
          modal: { ondismiss: () => resolve(null) },
        });
        r.open();
      });
      if (!paid) return toast.warn("Payment window closed.");
      const { data } = await api.post("/payments/verify", {
        orderId: order._id,
        razorpayOrderId: paid.razorpay_order_id,
        razorpayPaymentId: paid.razorpay_payment_id,
        razorpaySignature: paid.razorpay_signature,
      });
      setOrder(data);
      toast.success("Payment successful! 🎉");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      const { data } = await api.put(`/orders/${oid}`, { reason: "Cancelled from app" });
      setOrder(data);
      toast.success("Order cancelled.");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  const cancellable = ["placed", "confirmed", "processing"].includes(order.status);
  const payable = order.payment?.method === "razorpay" && order.payment?.status === "pending" && order.status === "placed";

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-surface p-6 shadow">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold text-text">#{String(order._id).slice(-8).toUpperCase()}</h1>
        <Badge>{order.status}</Badge>
        <span className="ml-auto font-extrabold text-text">₹{order.totalAmount}</span>
      </div>
      <StatusTimeline status={order.status} />

      <div className="mt-4 space-y-2">
        {(order.items || []).map((i, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-2xl bg-bg p-2">
            {i.productSnapshot?.images?.[0]?.url && (
              <img src={i.productSnapshot.images[0].url} alt="" className="h-12 w-12 rounded-xl object-cover" />
            )}
            <div className="flex-1 text-sm">
              <p className="font-bold text-text">{i.productSnapshot?.name}</p>
              <p className="text-text">Qty {i.qty} · ₹{i.unitPrice} each</p>
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-1 text-sm text-text">
        <dt className="font-bold">Subtotal</dt><dd className="text-right">₹{order.subtotal}</dd>
        <dt className="font-bold">Discount</dt><dd className="text-right">−₹{order.totalDiscount || 0}</dd>
        <dt className="font-bold">GST</dt><dd className="text-right">₹{order.totalGst}</dd>
        <dt className="font-bold">Shipping</dt><dd className="text-right">{order.shippingFee ? `₹${order.shippingFee}` : "FREE"}</dd>
        <dt className="font-bold">Payment</dt><dd className="text-right">{order.payment?.method === "cod" ? "COD" : "Prepaid"} ({order.payment?.status})</dd>
      </dl>

      <div className="mt-4 flex gap-2">
        {payable && <button onClick={payNow} disabled={busy} className="rounded-full bg-primary px-6 py-2.5 font-bold text-text shadow">Pay now</button>}
        {cancellable && <button onClick={cancel} disabled={busy} className={btnSecondary}>Cancel order</button>}
        <button onClick={() => navigate("/orders")} className="ml-auto font-bold text-text underline">All orders</button>
      </div>
    </div>
  );
};

export default OrderDetail;
