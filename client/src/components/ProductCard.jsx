import { Link } from "react-router-dom";
import { Badge, Price, Stars } from "./ui.jsx";

const thumb = (p) => p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;

const ProductCard = ({ product }) => (
  <Link
    to={`/products/${product.slug || product._id}`}
    className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div className="relative aspect-square bg-primary-soft/40">
      {thumb(product) ? (
        <img src={thumb(product)} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-5xl">{product.category === "toys" ? "🧸" : "💎"}</div>
      )}
      {product.mrp > product.price && (
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-text">
          {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3">
      <div className="flex gap-1">
        <Badge>{product.category}</Badge>
        {product.subCategory && <Badge tone="sand">{product.subCategory}</Badge>}
      </div>
      <p className="line-clamp-2 font-bold text-text">{product.name}</p>
      <Stars value={product.ratingAvg} />
      <div className="mt-auto pt-1">
        <Price price={product.price} mrp={product.mrp} />
      </div>
    </div>
  </Link>
);

export default ProductCard;
