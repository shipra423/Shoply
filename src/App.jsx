
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import {
  ShoppingBag,
  ShoppingCart,
  Search,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Package,
  LayoutDashboard,
  ClipboardList,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  LogOut,
  Heart,
  ZoomIn,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  seedProducts,
  initialOrders,
  productGallery,
} from "./data";

import { fetchProducts } from "./api";

// ==========================================
// HELPERS
// ==========================================

const ShopContext = createContext(null);

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

const categories = [
  "Women",
  "Men",
  "Electronics",
  "Home",
  "Beauty",
  "Sports",
];

function saved(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const useShop = () => useContext(ShopContext);

// ==========================================
// SHOP PROVIDER
// ==========================================

function ShopProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const existing = saved("shoply-products", []);

    if (!Array.isArray(existing)) {
      return seedProducts;
    }

    const existingIds = new Set(
      existing.map((p) => String(p.id))
    );

  const updatedProducts = existing.map((product) => {
  const original = seedProducts.find(
    (p) => String(p.id) === String(product.id)
  );

  return original
    ? {
        ...product,
        description: original.description,
      }
    : product;
});

const newProducts = seedProducts.filter(
  (p) => !existingIds.has(String(p.id))
);

return [...updatedProducts, ...newProducts];
  });

  const [cart, setCart] = useState(() =>
    saved("shoply-cart", [])
  );

  const [orders, setOrders] = useState(() =>
    saved("shoply-orders", initialOrders)
  );

  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const notify = (message) => setToast(message);

  const loadProducts = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const result = await fetchProducts();

      if (!Array.isArray(result)) {
        throw new Error("Invalid products response");
      }

      // Local/admin products remain available.
    } catch (error) {
      setLoadError(
        error.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "shoply-products",
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      "shoply-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "shoply-orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(
      () => setToast(""),
      3000
    );

    return () => clearTimeout(timer);
  }, [toast]);

  const add = (id, quantity = 1) => {
    const product = products.find(
      (p) => String(p.id) === String(id)
    );

    if (!product || product.stock <= 0) {
      notify("Product is out of stock");
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (p) => String(p.id) === String(id)
      );

      if (existing) {
        return current.map((p) =>
          String(p.id) === String(id)
            ? {
                ...p,
                qty: Math.min(
                  product.stock,
                  p.qty + quantity
                ),
              }
            : p
        );
      }

      return [
        ...current,
        {
          id: product.id,
          qty: Math.min(quantity, product.stock),
        },
      ];
    });

    notify("Added to cart");
  };

  const change = (id, qty) => {
    setCart((current) => {
      if (qty <= 0) {
        return current.filter(
          (p) => String(p.id) !== String(id)
        );
      }

      const product = products.find(
        (p) => String(p.id) === String(id)
      );

      return current
        .map((p) =>
          String(p.id) === String(id)
            ? {
                ...p,
                qty: Math.min(
                  qty,
                  product?.stock || 0
                ),
              }
            : p
        )
        .filter((p) => p.qty > 0);
    });
  };

  const items = cart
    .map((item) => ({
      ...products.find(
        (p) => String(p.id) === String(item.id)
      ),
      qty: item.qty,
    }))
    .filter((p) => p.name);

  const subtotal = items.reduce(
    (sum, p) => sum + p.price * p.qty,
    0
  );

  return (
    <ShopContext.Provider
      value={{
        products,
        setProducts,
        cart,
        setCart,
        orders,
        setOrders,
        items,
        subtotal,
        add,
        change,
        notify,
        loading,
        loadError,
        loadProducts,
      }}
    >
      {children}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </ShopContext.Provider>
  );
}

// ==========================================
// LOADING AND ERROR
// ==========================================

function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-100 bg-white">
      <div className="h-64 bg-slate-200" />

      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function ProductLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

function ProductErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto my-12 flex max-w-xl flex-col items-center rounded-3xl bg-red-50 p-10 text-center">
      <AlertTriangle
        size={44}
        className="text-red-600"
      />

      <h3 className="mt-5 text-2xl font-bold text-slate-900">
        Unable to load products
      </h3>

      <p className="mt-3 text-slate-600">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="mt-6 rounded-full bg-slate-950 px-7 py-3 font-semibold text-white transition hover:bg-emerald-700"
      >
        Try Again
      </button>
    </div>
  );
}

// ==========================================
// LIVE SEARCH
// ==========================================

function SearchSuggestions() {
  const { products, loading } = useShop();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return [];

    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(text) ||
          p.category.toLowerCase().includes(text)
      )
      .slice(0, 5);
  }, [products, query]);

  const openProduct = (id) => {
    setQuery("");
    setFocused(false);
    navigate(`/product/${id}`);
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-500">
        <Search
          size={19}
          className="shrink-0 text-slate-500"
        />

        <input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
            }

            if (
              e.key === "Enter" &&
              results.length
            ) {
              openProduct(results[0].id);
            }
          }}
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">
              Loading products...
            </p>
          ) : results.length ? (
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(e) =>
                  e.preventDefault()
                }
                onClick={() =>
                  openProduct(product.id)
                }
                className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition hover:bg-slate-50"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">
                    {product.name}
                  </strong>

                  <span className="text-xs text-slate-500">
                    {product.category}
                  </span>
                </div>

                <b className="text-sm text-emerald-700">
                  {money(product.price)}
                </b>
              </button>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-500">
              No matching products found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// NAVBAR
// ==========================================

function Header() {
  const { cart } = useShop();
  const [open, setOpen] = useState(false);

  const links = [
    ["Home", "/"],
    ["Shop", "/products"],
    ["Women", "/products?category=Women"],
    ["Men", "/products?category=Men"],
    ["Admin Dashboard", "/admin"],
  ];

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-3xl font-black tracking-tight text-slate-950"
        >
          <ShoppingBag className="text-emerald-600" />
          Shoply
          <span className="text-emerald-600">.</span>
        </Link>

        <nav
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full flex-col gap-2 border-b border-slate-100 bg-white p-5 shadow-lg lg:static lg:flex lg:flex-row lg:items-center lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          {links.map(([label, url]) => (
            <Link
              key={label}
              to={url}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-base font-semibold text-slate-700 transition hover:text-emerald-700 lg:text-lg"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:block">
          <SearchSuggestions />
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="relative rounded-full p-3 text-slate-900 transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Open cart"
          >
            <ShoppingCart size={24} />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-slate-900 lg:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 xl:hidden">
        <div className="mx-auto max-w-7xl">
          <SearchSuggestions />
        </div>
      </div>
    </header>
  );
}

// ==========================================
// PRODUCT CARD
// ==========================================

function ProductCard({ product }) {
  const { add } = useShop();

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={`/product/${product.id}`}
        className="relative block overflow-hidden bg-slate-100"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-sm">
          {product.stock === 0
            ? "Sold out"
            : product.stock < 8
              ? "Low stock"
              : "Popular"}
        </span>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-emerald-700">
            {product.category}
          </span>

          <span className="text-amber-500">
            ★ {product.rating}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-3 block min-h-14 text-lg font-bold text-slate-900 transition hover:text-emerald-700"
        >
          {product.name}
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <strong className="text-xl text-slate-950">
            {money(product.price)}
          </strong>

          <button
            type="button"
            onClick={() => add(product.id)}
            disabled={!product.stock}
            className="flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart size={17} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// HERO SLIDER
// ==========================================

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    eyebrow: "THE NEW COLLECTION · 2026",
    title: "Find your",
    highlight: "everyday",
    ending: "extraordinary.",
    description:
      "Discover beautifully curated fashion, tech, and home essentials made for modern living.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    eyebrow: "DISCOVER YOUR STYLE",
    title: "Style that",
    highlight: "speaks",
    ending: "for you.",
    description:
      "Explore modern fashion and timeless pieces for every occasion.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
    eyebrow: "CURATED FOR YOU",
    title: "Refresh your",
    highlight: "wardrobe",
    ending: "with Shoply.",
    description:
      "Discover handpicked essentials and elevate your everyday look.",
  },
];

// ==========================================
// HOME PAGE
// ==========================================

function Home() {
  const {
    products,
    loading,
    loadError,
    loadProducts,
    add,
  } = useShop();

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(
        (current) =>
          (current + 1) % heroSlides.length
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[activeSlide];

  const nextSlide = () =>
    setActiveSlide(
      (current) =>
        (current + 1) % heroSlides.length
    );

  const prevSlide = () =>
    setActiveSlide(
      (current) =>
        (current - 1 + heroSlides.length) %
        heroSlides.length
    );

  const featured = products.filter((product) =>
    [1, 2, 3].includes(Number(product.id))
  );

  return (
    <>
      {/* HERO */}

      <section className="overflow-hidden bg-[#f4f6f1]">
        <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div key={activeSlide}>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
              {slide.eyebrow}
            </span>

            <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
              {slide.title}
              <br />

              <span className="italic text-emerald-700">
                {slide.highlight}
              </span>{" "}
              {slide.ending}
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-600">
              {slide.description}
            </p>

            <Link
              to="/products"
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-slate-950 px-8 py-4 font-semibold text-white transition hover:bg-emerald-700"
            >
              Explore Collection
              <ArrowRight size={19} />
            </Link>

            <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>
                <b className="text-slate-950">10k+</b>{" "}
                Happy shoppers
              </span>

              <span className="text-emerald-600">✦</span>

              <span>
                <b className="text-slate-950">4.9/5</b>{" "}
                Customer love
              </span>
            </div>
          </div>

          <div className="relative h-[400px] overflow-hidden rounded-[2rem] shadow-2xl sm:h-[520px]">
            {heroSlides.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt={`Shoply collection ${index + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  index === activeSlide
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              />
            ))}

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 backdrop-blur-md">
              <span className="text-sm font-bold text-slate-900">
                Discover your style
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="rounded-full bg-slate-100 p-2 transition hover:bg-emerald-100"
                >
                  <ArrowLeft size={18} />
                </button>

                <span className="text-xs font-semibold text-slate-600">
                  {activeSlide + 1} /{" "}
                  {heroSlides.length}
                </span>

                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="rounded-full bg-slate-950 p-2 text-white transition hover:bg-emerald-700"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE LARGE FEATURED PRODUCTS */}

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
              HANDPICKED FOR YOU
            </span>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Trending right now
            </h2>

            <p className="mt-4 text-slate-500">
              Thoughtfully selected for your everyday.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:underline"
          >
            Shop all
            <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <ProductLoadingState />
        ) : loadError ? (
          <ProductErrorState
            message={loadError}
            onRetry={loadProducts}
          />
        ) : (
          <div className="space-y-10">
            {featured.map((product, index) => (
              <article
                key={product.id}
                className="grid overflow-hidden rounded-[2rem] border border-slate-100 bg-[#fafbf8] shadow-sm lg:grid-cols-2"
              >
                <Link
                  to={`/product/${product.id}`}
                  className={`relative block min-h-[350px] overflow-hidden bg-slate-100 lg:min-h-[490px] ${
                    index % 2 === 1
                      ? "lg:order-2"
                      : ""
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
                  />

                  <span className="absolute left-6 top-6 rounded-full bg-white px-5 py-2 text-xs font-bold tracking-widest text-slate-900">
                    FEATURED
                  </span>
                </Link>

                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
                  <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
                    <span className="uppercase tracking-widest text-emerald-700">
                      {product.category}
                    </span>

                    <span className="text-amber-500">
                      ★ {product.rating} / 5
                    </span>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="mt-6"
                  >
                    <h3 className="text-3xl font-black leading-tight tracking-tight text-slate-950 transition hover:text-emerald-700 sm:text-4xl">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-5 max-w-lg whitespace-pre-line text-[18px] font-normal leading-8 tracking-normal text-slate-600">
  {product.description}
</p>

                  <p
                    className={`mt-6 text-sm font-semibold ${
                      product.stock
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {product.stock
                      ? "✓ Available in stock"
                      : "Out of stock"}
                  </p>

                  <div className="mt-8 border-t border-slate-200 pt-8">
                    <strong className="block text-4xl font-black text-slate-950">
                      {money(product.price)}
                    </strong>

                    <button
                      type="button"
                      disabled={!product.stock}
                      onClick={() => add(product.id)}
                      className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                    >
                      <ShoppingCart size={19} />

                      {product.stock
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* PROMOTIONAL SECTION */}

      <section className="mx-auto mb-20 max-w-7xl px-5 lg:px-8">
        <div className="rounded-[2rem] bg-emerald-900 px-8 py-16 text-center text-white sm:px-12">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200">
            MAKE EVERY DAY COUNT
          </span>

          <h2 className="mt-5 text-4xl font-black sm:text-5xl">
            Good things, great finds.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-emerald-100">
            Discover something worth loving today.
          </p>

          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-emerald-950 transition hover:bg-emerald-100"
          >
            Shop now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ==========================================
// PRODUCT LISTING
// ==========================================

function Products() {
  const {
    products,
    loading,
    loadError,
    loadProducts,
  } = useShop();

  const location = useLocation();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(
      location.search
    );

    setCategory(params.get("category") || "All");
    setPage(1);
  }, [location.search]);

  const filtered = useMemo(() => {
    return products
      .filter(
        (p) =>
          (category === "All" ||
            p.category === category) &&
          p.price <= maxPrice &&
          p.name
            .toLowerCase()
            .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sort === "low") {
          return a.price - b.price;
        }

        if (sort === "high") {
          return b.price - a.price;
        }

        if (sort === "rating") {
          return b.rating - a.rating;
        }

        return Number(a.id) - Number(b.id);
      });
  }, [
    products,
    category,
    search,
    maxPrice,
    sort,
  ]);

  const perPage = 8;

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / perPage)
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="mb-10 rounded-[2rem] bg-[#f4f6f1] p-8 sm:p-12">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          THE SHOPLY EDIT / 2026
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {category === "Women"
            ? "The Women's Edit."
            : category === "Men"
              ? "The Men's Edit."
              : "Discover your next favorite."}
        </h1>

        <p className="mt-5 text-slate-600">
          Find what you love, all in one place.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* FILTER SIDEBAR */}

        <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">
            Filters
          </h3>

          <label className="mt-7 block text-sm font-semibold text-slate-700">
            Search products
          </label>

          <input
            value={search}
            placeholder="Search by name..."
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />

          <label className="mt-7 block text-sm font-semibold text-slate-700">
            Category
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === c
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-emerald-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="mt-7 block text-sm font-semibold text-slate-700">
            Maximum price: {money(maxPrice)}
          </label>

          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(Number(e.target.value));
              setPage(1);
            }}
            className="mt-4 w-full accent-emerald-700"
          />

          <button
            type="button"
            onClick={() => {
              setCategory("All");
              setSearch("");
              setMaxPrice(10000);
              setPage(1);
            }}
            className="mt-6 w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Clear filters
          </button>
        </aside>

        {/* PRODUCT RESULTS */}

        <div className="min-w-0">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-600">
              {loading
                ? "Loading products..."
                : loadError
                  ? "Products unavailable"
                  : `${filtered.length} products found`}
            </span>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="featured">
                Featured
              </option>

              <option value="low">
                Price: Low to High
              </option>

              <option value="high">
                Price: High to Low
              </option>

              <option value="rating">
                Top rated
              </option>
            </select>
          </div>

          {loading ? (
            <ProductLoadingState />
          ) : loadError ? (
            <ProductErrorState
              message={loadError}
              onRetry={loadProducts}
            />
          ) : filtered.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered
                .slice(
                  (page - 1) * perPage,
                  page * perPage
                )
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-50 p-14 text-center">
              <Search
                size={40}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-5 text-xl font-bold">
                No products found
              </h3>

              <p className="mt-3 text-slate-500">
                Try adjusting your filters.
              </p>
            </div>
          )}

          {!loading &&
            !loadError &&
            filtered.length > 0 && (
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {Array.from(
                  { length: pages },
                  (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setPage(index + 1);
                        window.scrollTo(0, 0);
                      }}
                      className={`h-11 w-11 rounded-full text-sm font-bold transition ${
                        page === index + 1
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-emerald-100"
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                )}
              </div>
            )}
        </div>
      </div>
    </main>
  );
}


/* ==========================================
   PRODUCT DETAILS
========================================== */

function ProductDetails() {
  const { id } = useParams();
  const { products, add, loading, loadError, loadProducts } =
    useShop();

  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setQty(1);
    setPhoto(0);
    setZoomOpen(false);
  }, [id]);

  useEffect(() => {
    if (!zoomOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [zoomOpen]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-16">
        <ProductLoadingState />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-16">
        <ProductErrorState
          message={loadError}
          onRetry={loadProducts}
        />
      </main>
    );
  }

  if (!product) return <NotFound />;

  const images =
    product.images?.length > 0
      ? product.images
      : productGallery[product.id] || [product.image];

  const related = products
    .filter(
      (p) =>
        p.category === product.category &&
        String(p.id) !== String(product.id)
    )
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Link
        to="/products"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"
      >
        <ArrowLeft size={18} />
        Back to shop
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* PRODUCT GALLERY */}

        <div>
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative block w-full overflow-hidden rounded-[2rem] bg-slate-100"
          >
            <img
              src={images[photo] || product.image}
              alt={product.name}
              className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-105 sm:h-[550px]"
            />

            <span className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg">
              <ZoomIn size={18} />
              Click to Zoom
            </span>
          </button>

          <div className="mt-5 flex flex-wrap gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPhoto(index)}
                className={`overflow-hidden rounded-xl border-2 transition ${
                  photo === index
                    ? "border-emerald-700"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="h-20 w-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCT INFORMATION */}

        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
            {product.category} / SHOPLY COLLECTION
          </span>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-xl text-amber-500">
              ★★★★★
            </span>

            <span className="text-sm text-slate-500">
              {product.rating} customer rating
            </span>
          </div>

          <strong className="mt-7 block text-4xl font-black text-slate-950">
            {money(product.price)}
          </strong>

          <p className="mt-7 text-base leading-8 text-slate-600">
            {product.description}
          </p>

          <p
            className={`mt-6 text-sm font-semibold ${
              product.stock > 0
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {product.stock > 0
              ? `${product.stock} items in stock`
              : "Currently out of stock"}
          </p>

          {product.stock > 0 && (
            <div className="mt-7 flex w-fit items-center overflow-hidden rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() =>
                  setQty((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="p-4 hover:bg-slate-100"
                aria-label="Decrease quantity"
              >
                <Minus size={18} />
              </button>

              <span className="min-w-12 text-center font-bold">
                {qty}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQty((current) =>
                    Math.min(
                      product.stock,
                      current + 1
                    )
                  )
                }
                className="p-4 hover:bg-slate-100"
                aria-label="Increase quantity"
              >
                <Plus size={18} />
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={!product.stock}
            onClick={() => add(product.id, qty)}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-5 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart size={20} />
            {product.stock
              ? "Add to Cart"
              : "Out of Stock"}
          </button>

          <div className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm font-medium leading-7 text-emerald-900">
            ✓ Secure checkout
            <br />
            ✓ Quality guaranteed
            <br />
            ✓ Carefully curated products
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}

      {related.length > 0 && (
        <section className="py-20">
          <h2 className="mb-10 text-3xl font-black text-slate-950">
            You may also like
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
              />
            ))}
          </div>
        </section>
      )}

      {/* IMAGE ZOOM */}

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-5"
          onClick={() => setZoomOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-6 top-6 rounded-full bg-white p-3 text-slate-950"
            aria-label="Close image zoom"
          >
            <X size={24} />
          </button>

          <img
            src={images[photo] || product.image}
            alt={product.name}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </main>
  );
}

/* ==========================================
   ORDER SUMMARY
========================================== */

function Summary({ subtotal, checkout = false }) {
  const delivery =
    subtotal === 0 || subtotal >= 2000 ? 0 : 99;

  const total = subtotal + delivery;

  return (
    <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">
      <h3 className="text-2xl font-black text-slate-950">
        Order summary
      </h3>

      <div className="mt-7 flex justify-between text-slate-600">
        <span>Subtotal</span>
        <b className="text-slate-900">
          {money(subtotal)}
        </b>
      </div>

      <div className="mt-5 flex justify-between text-slate-600">
        <span>Delivery</span>
        <b className="text-slate-900">
          {delivery ? money(delivery) : "Free"}
        </b>
      </div>

      <hr className="my-7 border-slate-200" />

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          Total
        </span>

        <strong className="text-2xl font-black">
          {money(total)}
        </strong>
      </div>

      {checkout && (
        <Link
          to="/checkout"
          className="mt-8 flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-emerald-700"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </Link>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Secure and convenient shopping
      </p>
    </aside>
  );
}

/* ==========================================
   CART PAGE
========================================== */

function Cart() {
  const { items, subtotal, change } = useShop();

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          YOUR SELECTION
        </span>

        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-5xl">
          Your shopping bag
        </h1>

        <p className="mt-4 text-slate-500">
          {items.length} unique items
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-[2rem] bg-slate-50 px-5 py-20 text-center">
          <ShoppingBag
            size={60}
            className="text-slate-400"
          />

          <h2 className="mt-6 text-3xl font-black text-slate-950">
            Your bag is empty
          </h2>

          <p className="mt-4 text-slate-500">
            Discover something beautiful to add.
          </p>

          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-8 py-4 font-semibold text-white hover:bg-emerald-700"
          >
            Start shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="shrink-0"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 w-full rounded-2xl object-cover sm:h-40 sm:w-40"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      {product.category}
                    </span>

                    <Link
                      to={`/product/${product.id}`}
                      className="mt-2 block text-xl font-bold text-slate-950 hover:text-emerald-700"
                    >
                      {product.name}
                    </Link>

                    <strong className="mt-3 block text-lg">
                      {money(product.price)}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center overflow-hidden rounded-full border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          change(
                            product.id,
                            product.qty - 1
                          )
                        }
                        className="p-3 hover:bg-slate-100"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-10 text-center font-bold">
                        {product.qty}
                      </span>

                      <button
                        type="button"
                        disabled={
                          product.qty >= product.stock
                        }
                        onClick={() =>
                          change(
                            product.id,
                            product.qty + 1
                          )
                        }
                        className="p-3 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        change(product.id, 0)
                      }
                      className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={17} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Summary
            subtotal={subtotal}
            checkout
          />
        </div>
      )}
    </main>
  );
}

/* ==========================================
   CHECKOUT PAGE
========================================== */

function Checkout() {
  const {
    items,
    subtotal,
    setCart,
    orders,
    setOrders,
    notify,
  } = useShop();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment: "COD",
  });

  const delivery =
    subtotal === 0 || subtotal >= 2000 ? 0 : 99;

  const total = subtotal + delivery;

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const placeOrder = (event) => {
    event.preventDefault();

    if (!items.length) {
      notify("Your cart is empty");
      navigate("/cart");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      notify("Enter a valid 10-digit phone number");
      return;
    }

    if (!/^[0-9]{6}$/.test(form.pincode.trim())) {
      notify("Enter a valid 6-digit pincode");
      return;
    }

    const orderId = `SH-${Date.now()}`;

    const newOrder = {
      id: orderId,
      customer: form.name,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      payment: form.payment,
      paymentMethod: form.payment,
      items: items.map((item) => ({
        ...item,
      })),
      subtotal,
      delivery,
      total,
      status: "Pending",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setOrders([newOrder, ...orders]);
    setCart([]);

    notify("Order placed successfully!");

    navigate(`/order-success/${orderId}`, {
      state: { order: newOrder },
    });
  };

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  const labelClass =
    "block text-sm font-semibold text-slate-700";

  if (!items.length) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <ShoppingBag
          size={54}
          className="mx-auto text-slate-400"
        />

        <h1 className="mt-6 text-3xl font-black">
          Your cart is empty
        </h1>

        <p className="mt-4 text-slate-500">
          Add products before proceeding to checkout.
        </p>

        <Link
          to="/products"
          className="mt-8 inline-flex rounded-full bg-slate-950 px-8 py-4 font-bold text-white hover:bg-emerald-700"
        >
          Explore Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
        ALMOST THERE
      </span>

      <h1 className="mt-4 text-4xl font-black text-slate-950">
        Secure checkout
      </h1>

      <p className="mt-4 text-slate-500">
        Enter your details to complete your order.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={placeOrder}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10"
        >
          <h2 className="text-2xl font-black">
            Contact information
          </h2>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <label className={labelClass}>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={update}
                required
                placeholder="Enter full name"
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                required
                placeholder="example@email.com"
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Phone number
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                className={fieldClass}
              />
            </label>
          </div>

          <h2 className="mt-12 text-2xl font-black">
            Delivery address
          </h2>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Complete address
              <textarea
                name="address"
                value={form.address}
                onChange={update}
                required
                rows={3}
                placeholder="House number, street, area..."
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              City
              <input
                name="city"
                value={form.city}
                onChange={update}
                required
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              State
              <input
                name="state"
                value={form.state}
                onChange={update}
                required
                className={fieldClass}
              />
            </label>

            <label className={labelClass}>
              Pincode
              <input
                name="pincode"
                value={form.pincode}
                onChange={update}
                required
                maxLength={6}
                inputMode="numeric"
                className={fieldClass}
              />
            </label>
          </div>

          <h2 className="mt-12 text-2xl font-black">
            Payment method
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["COD", "Cash on Delivery"],
              ["UPI", "UPI (Demo)"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-5 font-semibold transition ${
                  form.payment === value
                    ? "border-emerald-700 bg-emerald-50"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={form.payment === value}
                  onChange={update}
                  className="accent-emerald-700"
                />

                {label}
              </label>
            ))}
          </div>

          {form.payment === "UPI" && (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Demo checkout: UPI payment is not
              processed. No money will be collected.
            </p>
          )}

          <button
            type="submit"
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-5 font-bold text-white transition hover:bg-emerald-700"
          >
            Place Order — {money(total)}
            <ArrowRight size={19} />
          </button>
        </form>

        <div>
          <Summary subtotal={subtotal} />

          <div className="mt-5 rounded-3xl bg-slate-50 p-6">
            <h3 className="text-lg font-bold">
              Items in your order
            </h3>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      Qty: {item.qty}
                    </p>
                  </div>

                  <b className="text-sm">
                    {money(item.price * item.qty)}
                  </b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ==========================================
   ORDER SUCCESS
========================================== */

function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const { orders } = useShop();

  const order =
    location.state?.order ||
    orders.find(
      (item) => String(item.id) === String(id)
    );

  return (
    <main className="mx-auto max-w-4xl px-5 py-20">
      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-10 text-center sm:p-16">
        <CheckCircle2
          size={74}
          className="mx-auto text-emerald-700"
        />

        <span className="mt-7 block text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          ORDER CONFIRMED
        </span>

        <h1 className="mt-5 text-4xl font-black text-slate-950 sm:text-5xl">
          Thank you for shopping!
        </h1>

        <p className="mt-5 text-slate-600">
          Your order has been placed successfully.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Order number
          </p>

          <strong className="mt-2 block break-all text-xl text-slate-950">
            {id}
          </strong>

          {order && (
            <>
              <p className="mt-5 text-sm text-slate-500">
                Order total
              </p>

              <strong className="mt-2 block text-2xl text-emerald-700">
                {money(order.total)}
              </strong>
            </>
          )}
        </div>

        <Link
          to="/products"
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-slate-950 px-8 py-4 font-bold text-white transition hover:bg-emerald-700"
        >
          Continue Shopping
          <ArrowRight size={18} />
        </Link>
      </div>
    </main>
  );
}

/* ==========================================
   ADMIN HELPERS
========================================== */

const adminInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function AdminStat({
  title,
  value,
  icon: Icon,
  color = "emerald",
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          colors[color] || colors.emerald
        }`}
      >
        <Icon size={23} />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <strong className="mt-2 block text-3xl font-black text-slate-950">
        {value}
      </strong>
    </div>
  );
}

/* ==========================================
   ADMIN DASHBOARD
========================================== */

function AdminDashboard() {
  const { products, orders } = useShop();

  const revenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const lowStock = products.filter(
    (product) => Number(product.stock) < 8
  ).length;

  const salesData = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      const dayKey = date.toDateString();

      const sales = orders
        .filter((order) => {
          const rawDate =
            order.createdAt || order.date;

          if (!rawDate) return false;

          const orderDate = new Date(rawDate);

          return (
            !Number.isNaN(orderDate.getTime()) &&
            orderDate.toDateString() === dayKey
          );
        })
        .reduce(
          (sum, order) =>
            sum + Number(order.total || 0),
          0
        );

      return {
        day: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        sales,
      };
    });
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          BUSINESS OVERVIEW
        </span>

        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
          Dashboard Overview
        </h1>

        <p className="mt-3 text-slate-500">
          Monitor your Shoply store performance.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          title="Total Revenue"
          value={money(revenue)}
          icon={LayoutDashboard}
          color="emerald"
        />

        <AdminStat
          title="Total Orders"
          value={orders.length}
          icon={ClipboardList}
          color="blue"
        />

        <AdminStat
          title="Total Products"
          value={products.length}
          icon={Package}
          color="purple"
        />

        <AdminStat
          title="Low Stock Products"
          value={lowStock}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Sales Overview
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Revenue over the last seven days
          </p>

          <div className="mt-8 h-72 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="shoplySalesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#059669"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="95%"
                      stopColor="#059669"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="day" />
                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    money(value)
                  }
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#059669"
                  strokeWidth={3}
                  fill="url(#shoplySalesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Quick Actions
          </h2>

          <div className="mt-7 space-y-4">
            <Link
              to="/admin/products"
              className="flex items-center justify-between rounded-2xl bg-emerald-50 p-5 font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              Manage Products
              <ArrowRight size={19} />
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              View Orders
              <ArrowRight size={19} />
            </Link>

            <Link
              to="/products"
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Visit Store
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">
            Recent Orders
          </h2>

          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-emerald-700"
          >
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-6 text-slate-500">
            No orders available.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100"
                  >
                    <td className="p-4 font-semibold">
                      {order.id}
                    </td>

                    <td className="p-4">
                      {order.customer ||
                        order.name ||
                        "Customer"}
                    </td>

                    <td className="p-4">
                      {money(order.total)}
                    </td>

                    <td className="p-4">
                      {order.status || "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN PRODUCT MANAGEMENT
========================================== */

function AdminProducts() {
  const {
    products,
    setProducts,
    notify,
  } = useShop();

  const emptyForm = {
    name: "",
    category: "Women",
    price: "",
    stock: "",
    image: "",
    description: "",
    rating: "4.5",
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveProduct = (event) => {
    event.preventDefault();

    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = Number(form.rating);

    if (
      !form.name.trim() ||
      !form.image.trim() ||
      !form.description.trim()
    ) {
      notify("Please fill all product details");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      notify("Enter valid price, stock and rating");
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      price,
      stock,
      image: form.image.trim(),
      description: form.description.trim(),
      rating,
    };

    if (editingId !== null) {
      setProducts((current) =>
        current.map((product) =>
          String(product.id) === String(editingId)
            ? {
                ...product,
                ...productData,
              }
            : product
        )
      );

      notify("Product updated successfully");
    } else {
      const numericIds = products
        .map((product) => Number(product.id))
        .filter(Number.isFinite);

      const nextId =
        Math.max(0, ...numericIds) + 1;

      setProducts((current) => [
        ...current,
        {
          id: nextId,
          ...productData,
        },
      ]);

      notify("Product added successfully");
    }

    resetForm();
  };

  const editProduct = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "Women",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      image: product.image || "",
      description: product.description || "",
      rating: String(product.rating ?? 4.5),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteProduct = (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    setProducts((current) =>
      current.filter(
        (product) =>
          String(product.id) !== String(id)
      )
    );

    notify("Product deleted");
  };

  const filtered = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          INVENTORY MANAGEMENT
        </span>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Manage Products
        </h1>

        <p className="mt-3 text-slate-500">
          Add, update and remove store products.
        </p>
      </div>

      {/* PRODUCT FORM */}

      <form
        onSubmit={saveProduct}
        className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="text-xl font-black">
          {editingId !== null
            ? "Edit Product"
            : "Add New Product"}
        </h2>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Product Name
            <input
              name="name"
              value={form.name}
              onChange={update}
              required
              className={`mt-2 ${adminInputClass}`}
              placeholder="Enter product name"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Category
            <select
              name="category"
              value={form.category}
              onChange={update}
              className={`mt-2 ${adminInputClass}`}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Price (₹)
            <input
              type="number"
              name="price"
              min="1"
              value={form.price}
              onChange={update}
              required
              className={`mt-2 ${adminInputClass}`}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Stock Quantity
            <input
              type="number"
              name="stock"
              min="0"
              step="1"
              value={form.stock}
              onChange={update}
              required
              className={`mt-2 ${adminInputClass}`}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Rating (0–5)
            <input
              type="number"
              name="rating"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={update}
              required
              className={`mt-2 ${adminInputClass}`}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Image URL
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={update}
              required
              placeholder="https://..."
              className={`mt-2 ${adminInputClass}`}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              required
              rows={4}
              className={`mt-2 ${adminInputClass}`}
              placeholder="Describe the product..."
            />
          </label>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-4 font-semibold text-white hover:bg-emerald-700"
          >
            {editingId !== null ? (
              <Pencil size={18} />
            ) : (
              <Plus size={18} />
            )}

            {editingId !== null
              ? "Update Product"
              : "Add Product"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-7 py-4 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </form>

      {/* PRODUCT TABLE */}

      <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <h2 className="text-xl font-black">
            Product Inventory ({products.length})
          </h2>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search inventory..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 sm:w-72"
          />
        </div>

        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />

                      <span className="font-semibold text-slate-900">
                        {product.name}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    {product.category}
                  </td>

                  <td className="p-4 font-semibold">
                    {money(product.price)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        product.stock < 8
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          editProduct(product)
                        }
                        className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                        aria-label="Edit product"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                        className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
                        aria-label="Delete product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN ORDERS
========================================== */

function AdminOrders() {
  const { orders, setOrders, notify } = useShop();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const statuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  const filtered = orders.filter((order) => {
    const text = [
      order.id,
      order.customer,
      order.name,
      order.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (statusFilter === "All" ||
        (order.status || "Pending") === statusFilter)
    );
  });

  const changeStatus = (id, status) => {
    setOrders((current) =>
      current.map((order) =>
        String(order.id) === String(id)
          ? {
              ...order,
              status,
            }
          : order
      )
    );

    notify("Order status updated");
  };

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
          CUSTOMER ORDERS
        </span>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Order Management
        </h1>

        <p className="mt-3 text-slate-500">
          Track orders and update their status.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search order or customer..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 sm:w-80"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
          >
            <option value="All">
              All Statuses
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 font-semibold">
                    {order.id}
                  </td>

                  <td className="p-4">
                    <strong className="block text-slate-900">
                      {order.customer ||
                        order.name ||
                        "Customer"}
                    </strong>

                    <span className="text-xs text-slate-500">
                      {order.email || ""}
                    </span>
                  </td>

                  <td className="p-4">
                    {Array.isArray(order.items)
                      ? order.items.reduce(
                          (sum, item) =>
                            sum + Number(item.qty || 1),
                          0
                        )
                      : 0}
                  </td>

                  <td className="p-4 font-bold">
                    {money(order.total)}
                  </td>

                  <td className="p-4">
                    {order.payment ||
                      order.paymentMethod ||
                      "COD"}
                  </td>

                  <td className="p-4">
                    <select
                      value={
                        statuses.includes(order.status)
                          ? order.status
                          : "Pending"
                      }
                      onChange={(event) =>
                        changeStatus(
                          order.id,
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-600"
                    >
                      {statuses.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN LAYOUT
========================================== */

function AdminLayout({ children }) {
  const location = useLocation();

  const links = [
    {
      label: "Overview",
      to: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      to: "/admin/products",
      icon: Package,
    },
    {
      label: "Orders",
      to: "/admin/orders",
      icon: ClipboardList,
    },
  ];

  return (
    <main className="min-h-[80vh] bg-[#f7f9f8]">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-3">
              <LayoutDashboard size={22} />
            </div>

            <div>
              <strong className="block text-xl">
                Shoply Admin
              </strong>

              <span className="text-xs text-slate-400">
                Store Management
              </span>
            </div>
          </div>

          <div className="mt-9 space-y-2">
            {links.map((item) => {
              const Icon = item.icon;

              const active =
                location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-9 border-t border-slate-700 pt-6">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut size={19} />
              Back to Store
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}

/* ==========================================
   FOOTER
========================================== */

function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-slate-500 lg:px-8">
          
        </div>
      </div>
    </footer>
  );
}

/* ==========================================
   404 PAGE
========================================== */

function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-24 text-center">
      <span className="text-8xl font-black text-emerald-700">
        404
      </span>

      <h1 className="mt-6 text-4xl font-black text-slate-950">
        Page not found
      </h1>

      <p className="mt-5 text-slate-500">
        The page you're looking for doesn't exist.
      </p>

      <Link
        to="/"
        className="mt-9 inline-flex items-center gap-3 rounded-full bg-slate-950 px-8 py-4 font-bold text-white hover:bg-emerald-700"
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>
    </main>
  );
}

/* ==========================================
   SCROLL TO TOP ON ROUTE CHANGE
========================================== */

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/* ==========================================
   MAIN APPLICATION
========================================== */

function ShoplyApp() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <ScrollToTop />

      <Header />

      <Routes>
        {/* CUSTOMER ROUTES */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/order-success/:id"
          element={<OrderSuccess />}
        />

        {/* ADMIN ROUTES */}

        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          }
        />

        {/* NOT FOUND */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <Footer />
    </div>
  );
}

/* ==========================================
   APP EXPORT
========================================== */

export default function App() {
  return (
    <ShopProvider>
      <ShoplyApp />
    </ShopProvider>
  );
}

// ==========================================
// 
// ==========================================
