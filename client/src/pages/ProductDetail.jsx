import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { apiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Badge, ErrorState, Field, Loader, Price, Stars, btnPrimary, inputCls } from "../components/ui.jsx";

const ProductDetail = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, title: "", text: "" });

  useEffect(() => {
    setState("loading");
    api
      .get(`/products/${pid}`)
      .then(({ data }) => {
        setProduct(data);
        setImg(0);
        setVariant("");
        setState("done");
        return api.get(`/products/${data._id}/review/`).catch(() => ({ data: [] }));
      })
      .then(({ data }) => setReviews(data || []))
      .catch((e) => {
        setError(apiError(e, "Product not found"));
        setState("error");
      });
  }, [pid]);

  const selectedVariant = product?.variants?.find((v) => v.sku === variant);
  const maxStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const price = selectedVariant ? selectedVariant.price : product?.price;

  const addToCart = async () => {
    if (!isLoggedIn) return navigate("/login", { state: { from: `/products/${pid}` } });
    if (product.variants?.length && !variant) return toast.warn("Please choose a variant");
    try {
      await api.post("/cart", { productId: product._id, qty, ...(variant ? { variantSku: variant } : {}) });
      toast.success("Added to cart! 🛒");
      navigate("/cart");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return navigate("/login");
    try {
      const { data } = await api.post(`/products/${product._id}/review/`, form);
      setReviews([data, ...reviews]);
      setForm({ rating: 5, title: "", text: "" });
      toast.success("Review posted. Thank you!");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (state === "loading") return <Loader label="Opening the gift box…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const tf = product.category === "toys" ? product.toysFields : product.jewelleryFields;

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-surface shadow">
            {product.images?.length ? (
              <img src={product.images[img]?.url} alt={product.images[img]?.alt || product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-8xl">{product.category === "toys" ? "🧸" : "💎"}</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-2 flex gap-2">
              {product.images.map((im, i) => (
                <button key={i} onClick={() => setImg(i)} className={`overflow-hidden rounded-xl border-2 ${i === img ? "border-accent" : "border-transparent"}`}>
                  <img src={im.url} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="rounded-2xl bg-surface p-6 shadow">
          <div className="flex flex-wrap gap-1">
            <Badge>{product.category}</Badge>
            {product.subCategory && <Badge tone="sand">{product.subCategory}</Badge>}
            {product.brand && <Badge tone="sand">{product.brand}</Badge>}
          </div>
          <h1 className="font-display mt-2 text-3xl font-extrabold text-text">{product.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={product.ratingAvg} />
            <span className="text-sm font-bold text-text">({product.ratingCount || 0})</span>
          </div>
          <div className="mt-3"><Price price={price} mrp={product.mrp} big /></div>
          <p className="mt-1 text-xs font-bold text-text">Incl. {product.gstRate ?? 18}% GST</p>
          <p className="mt-3 text-text">{product.description}</p>

          {/* Category-specific specs */}
          {tf && (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {product.category === "toys" && (
                <>
                  {tf.ageGroup && <><dt className="font-bold text-text">Age group</dt><dd className="text-text">{tf.ageGroup} yrs</dd></>}
                  {tf.batteryRequired !== undefined && <><dt className="font-bold text-text">Battery</dt><dd className="text-text">{tf.batteryRequired ? "Required" : "Not required"}</dd></>}
                  {tf.safetyCertifications?.length > 0 && <><dt className="font-bold text-text">Safety</dt><dd className="text-text">{tf.safetyCertifications.join(", ")}</dd></>}
                </>
              )}
              {product.category === "jewellery" && (
                <>
                  {tf.material && <><dt className="font-bold text-text">Material</dt><dd className="text-text">{tf.material}</dd></>}
                  {tf.purity && <><dt className="font-bold text-text">Purity</dt><dd className="text-text">{tf.purity}</dd></>}
                  {tf.stoneType && <><dt className="font-bold text-text">Stone</dt><dd className="text-text">{tf.stoneType}</dd></>}
                  {tf.weightGrams != null && <><dt className="font-bold text-text">Weight</dt><dd className="text-text">{tf.weightGrams} g</dd></>}
                  {tf.careInstructions && <div className="col-span-2"><dt className="font-bold text-text">Care</dt><dd className="text-text">{tf.careInstructions}</dd></div>}
                </>
              )}
            </dl>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-text">Choose: </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    onClick={() => setVariant(v.sku)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold text-text ${variant === v.sku ? "border-accent bg-primary-soft" : "border-accent/50 bg-bg"}`}
                  >
                    {v.label} · ₹{v.price} {v.stock === 0 ? "(out)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className={`mt-3 text-sm font-bold ${maxStock > 0 ? "text-text" : "text-red-700"}`}>
            {maxStock > 0 ? (maxStock <= 5 ? `Only ${maxStock} left — hurry!` : "In stock ✅") : "Out of stock"}
            {!product.isReturnable && " · Non-returnable"}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <input type="number" min="1" max={Math.max(maxStock, 1)} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-20 rounded-2xl border-2 border-accent/60 bg-bg px-3 py-2 text-center font-bold text-text" />
            <button onClick={addToCart} disabled={maxStock === 0} className={btnPrimary}>Add to cart 🛒</button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-8 rounded-2xl bg-surface p-6 shadow">
        <h2 className="font-display text-2xl font-extrabold text-text">Reviews ({reviews.length})</h2>
        <form onSubmit={submitReview} className="mt-4 grid gap-3 rounded-2xl bg-bg p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rating">
              <select className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </Field>
            <Field label="Title (optional)">
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sums it up" />
            </Field>
          </div>
          <Field label="Your review">
            <textarea className={inputCls} rows="3" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required placeholder="What did you love?" />
          </Field>
          <button className={btnPrimary + " w-fit"}>Post review</button>
        </form>
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-2xl bg-bg p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text">
                <Stars value={r.rating} />
                <span>{r.user?.name || "Shopper"}</span>
                {r.isVerifiedBuyer && <Badge>Verified buyer</Badge>}
              </div>
              {r.title && <p className="font-bold text-text">{r.title}</p>}
              <p className="text-text">{r.text}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-text">No reviews yet — be the first!</p>}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
