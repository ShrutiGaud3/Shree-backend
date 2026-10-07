import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { CATEGORIES, STORE_NAME, STORE_TAGLINE } from "../config/site.js";
import ProductCard from "../components/ProductCard.jsx";
import { ErrorState, Loader, SectionTitle } from "../components/ui.jsx";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products", { params: { limit: 8 } })
      .then(({ data }) => {
        setFeatured(data.items || []);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-primary-soft p-8 text-center shadow md:p-12">
        <h1 className="font-display text-4xl font-extrabold text-text md:text-5xl">
          Welcome to {STORE_NAME}! 🧸💎
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-lg font-semibold text-text">{STORE_TAGLINE}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/products?category=toys" className="rounded-full bg-primary px-7 py-3 font-bold text-text shadow hover:bg-bg">
            Shop Toys
          </Link>
          <Link to="/products?category=jewellery" className="rounded-full border-2 border-accent bg-bg px-7 py-3 font-bold text-text shadow hover:bg-surface">
            Shop Jewellery
          </Link>
        </div>
      </section>

      {/* Category tiles */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <Link
            key={key}
            to={`/products?category=${key}`}
            className={`rounded-2xl p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg ${
              key === "toys" ? "bg-primary-soft" : "bg-surface border-2 border-accent/50"
            }`}
          >
            <p className="text-4xl">{key === "toys" ? "🧸" : "💎"}</p>
            <h2 className="font-display mt-2 text-2xl font-extrabold text-text">{cat.label}</h2>
            <p className="text-text">{cat.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.values(cat.subCategories).map((s) => (
                <span key={s} className="rounded-full bg-bg px-3 py-1 text-xs font-bold text-text shadow-sm">
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      {/* Featured */}
      <section className="mt-10">
        <SectionTitle title="Featured picks" sub="Loved by little ones and jewellery lovers alike" />
        {state === "loading" && <Loader label="Fetching goodies…" />}
        {state === "error" && <ErrorState message={error} onRetry={() => window.location.reload()} />}
        {state === "done" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
