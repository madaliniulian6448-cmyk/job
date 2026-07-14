import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin, Phone, Tag, Search, Building2, Star,
  Utensils, Scissors, Wrench, Truck, Heart, BookOpen,
  ArrowRight, CheckCircle, Users, Briefcase, Sparkles, Leaf,
  ArrowUpDown, Zap, BadgeCheck, SlidersHorizontal, Map as MapIcon, List as ListIcon,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { cityToSlug } from "./CategoryPage";
import ListingsMap from "../components/ListingsMap";
import { Helmet } from "react-helmet-async";
import { EmptyState } from "../components/ui/empty-state";

const CITIES = [
  "", "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
  "Craiova", "Brașov", "Galați", "Ploiești", "Oradea",
  "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
];

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  images: string[];
  createdAt: string;
  isPromoted: boolean;
  promotedUntil: string | null;
  ratingAvg: string | null;
  reviewCount: number;
  owner: {
    id: number;
    name: string;
    businessType: string;
    businessName: string | null;
    isVerified: boolean;
  };
  category: { id: number; name: string; slug: string } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "mancare": <Utensils className="h-5 w-5" />,
  "frizerie": <Scissors className="h-5 w-5" />,
  "reparatii": <Wrench className="h-5 w-5" />,
  "transport": <Truck className="h-5 w-5" />,
  "sanatate": <Heart className="h-5 w-5" />,
  "educatie": <BookOpen className="h-5 w-5" />,
  "curatenie": <Sparkles className="h-5 w-5" />,
  "gradinari": <Leaf className="h-5 w-5" />,
  "gradinărit": <Leaf className="h-5 w-5" />,
  "curătenie": <Sparkles className="h-5 w-5" />,
};

function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] || <Briefcase className="h-5 w-5" />;
}

export default function HomePage() {
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const navigate = useNavigate();

  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings", city, categoryId, minPrice, maxPrice, minRating, sort],
    queryFn: () => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (categoryId) params.set("categoryId", categoryId);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);
      return apiFetch(`/listings?${params}`);
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });

  const { data: favIdsData } = useQuery({
    queryKey: ["favorite-ids"],
    queryFn: () => apiFetch("/favorites/ids"),
    enabled: !!user,
  });
  const favIds: number[] = favIdsData?.ids ?? [];

  const toggleFav = useMutation({
    mutationFn: ({ id, isFav }: { id: number; isFav: boolean }) =>
      apiFetch(`/favorites/${id}`, { method: isFav ? "DELETE" : "POST" }),
    onMutate: async ({ id, isFav }) => {
      await qc.cancelQueries({ queryKey: ["favorite-ids"] });
      const prev = qc.getQueryData<{ ids: number[] }>(["favorite-ids"]);
      qc.setQueryData(["favorite-ids"], {
        ids: isFav ? prev!.ids.filter((x) => x !== id) : [...(prev?.ids ?? []), id],
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(["favorite-ids"], ctx?.prev); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const listings: Listing[] = listingsData?.listings ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];

  const textFiltered = search.trim()
    ? listings.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.owner.businessName?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  // Server already applies price/rating filters, promoted-first ordering, and
  // the chosen sort — only the free-text search is done client-side.
  const filtered = textFiltered;

  function handleCategoryClick(cat: Category) {
    const slug = city ? `${cat.slug}-${cityToSlug(city)}` : cat.slug;
    navigate(`/${slug}`);
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>ServiciiLocale - Găsește servicii locale verificate în orașul tău</title>
        <meta name="description" content="Mâncare gătită acasă, frizeri, meșteri, transport — descoperă și contactează prestatori locali verificați din orașul tău, cu recenzii reale." />
      </Helmet>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-foreground">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, #1d4ed8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-0 md:pt-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pb-16 md:pb-24">
            <div>
              <div className="inline-flex items-center gap-2.5 bg-white rounded-full px-4 py-2 text-sm font-medium text-slate-700 mb-8 border border-slate-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" style={{ boxShadow: "0 0 6px #34d399" }} />
                Platforma #1 pentru servicii locale în România
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.08] text-slate-900">
                Găsește servicii<br />
                <span className="text-primary">locale acum</span>
              </h1>

              <p className="text-lg text-slate-600 mb-10 max-w-md leading-relaxed">
                Mâncare gătită acasă, frizeri, meșteri, transport —<br className="hidden sm:block" /> totul local, totul verificat.
              </p>

              <div className="bg-white rounded-2xl p-1.5 flex flex-col sm:flex-row gap-1 border border-slate-200 shadow-[0_8px_40px_rgba(59,130,246,0.15)]">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="text" placeholder="Caută servicii, firme..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-slate-700 placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none bg-transparent" />
                </div>
                <div className="hidden sm:block w-px bg-slate-100 self-stretch my-1" />
                <Select value={city || "__all"} onValueChange={v => setCity(v === "__all" ? "" : v)}>
                  <SelectTrigger className="sm:w-44 px-4 py-3 text-slate-600 rounded-xl text-sm font-medium border-0 shadow-none bg-transparent focus:ring-0 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Toate orașele</SelectItem>
                    {CITIES.filter(c => c).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/40">
                  <Search className="h-4 w-4" />Caută
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {["Frizerie", "Meșteri", "Transport", "Mâncare", "Curățenie"].map(tag => (
                  <button key={tag} onClick={() => setSearch(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Decorative cards */}
            <div className="hidden lg:block relative h-[400px]">
              <div className="absolute top-6 left-10 w-56 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(-3deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0"><Utensils className="h-5 w-5" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">Mâncare acasă</div><div className="text-xs text-slate-500">Andreea C. · București</div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}<span className="text-xs text-slate-500 ml-1">5.0</span></div>
                  <span className="text-xs font-bold text-emerald-600">50 RON</span>
                </div>
              </div>
              <div className="absolute top-2 right-6 w-52 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(2.5deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 shrink-0"><Scissors className="h-5 w-5" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">Frizerie Pro</div><div className="text-xs text-slate-500">Salon Elite · Cluj</div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">{[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}<Star className="h-3 w-3 text-slate-200" /><span className="text-xs text-slate-500 ml-1">4.8</span></div>
                  <span className="text-xs font-bold text-emerald-600">35 RON</span>
                </div>
              </div>
              <div className="absolute bottom-16 left-4 w-52 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(1.5deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500 shrink-0"><Wrench className="h-5 w-5" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">Reparații rapide</div><div className="text-xs text-slate-500">Mihai R. · Timișoara</div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}<span className="text-xs text-slate-500 ml-1">4.9</span></div>
                  <span className="text-xs font-bold text-emerald-600">80 RON</span>
                </div>
              </div>
              <div className="absolute bottom-8 right-4 w-48 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(-2deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-500 shrink-0"><Truck className="h-5 w-5" /></div>
                  <div className="min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">Transport</div><div className="text-xs text-slate-500">Cluj Express</div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">{[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}<Star className="h-3 w-3 text-slate-200" /><span className="text-xs text-slate-500 ml-1">4.7</span></div>
                  <span className="text-xs font-bold text-emerald-600">120 RON</span>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-300 blur-3xl opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-slate-200 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-3 gap-4 sm:flex sm:justify-between sm:items-center">
              <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-blue-100 text-primary"><Users className="h-5 w-5" /></div><div><div className="text-lg font-extrabold text-slate-900 tracking-tight">500+</div><div className="text-xs text-slate-500">Utilizatori activi</div></div></div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-purple-100 text-purple-600"><Briefcase className="h-5 w-5" /></div><div><div className="text-lg font-extrabold text-slate-900 tracking-tight">200+</div><div className="text-xs text-slate-500">Firme locale</div></div></div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><MapPin className="h-5 w-5" /></div><div><div className="text-lg font-extrabold text-slate-900 tracking-tight">20+</div><div className="text-xs text-slate-500">Orașe acoperite</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-foreground">Categorii populare</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategoryId("")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${!categoryId ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                <Search className="h-3.5 w-3.5" />Toate categoriile
              </button>
              {categories.map(cat => (
                <button key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${categoryId === String(cat.id) ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                  {getCategoryIcon(cat.slug)}{cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {categoryId && categories.find(c => String(c.id) === categoryId)
                ? categories.find(c => String(c.id) === categoryId)?.name
                : city ? `Servicii în ${city}` : "Toate anunțurile"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Se încarcă..." : `${filtered.length} ${filtered.length === 1 ? "anunț" : "anunțuri"} disponibile`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${showFilters || minPrice || maxPrice || minRating ? "bg-primary/5 border-primary/40 text-primary" : "bg-white border-border text-foreground hover:border-primary/40"}`}>
              <SlidersHorizontal className="h-3.5 w-3.5" />Filtre
            </button>
            <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-1 py-0.5 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground ml-2 flex-shrink-0" />
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="border-0 shadow-none bg-transparent focus:ring-0 h-auto px-2 py-1 text-sm font-medium text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Cele mai noi</SelectItem>
                  <SelectItem value="price_asc">Preț crescător</SelectItem>
                  <SelectItem value="price_desc">Preț descrescător</SelectItem>
                  <SelectItem value="rating">Cele mai bine notate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center bg-white border border-border rounded-lg p-0.5">
              <button onClick={() => setView("list")} title="Vizualizare listă"
                className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView("map")} title="Vizualizare hartă"
                className={`p-1.5 rounded-md transition-colors ${view === "map" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                <MapIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            {(city || categoryId || search || minPrice || maxPrice || minRating) && (
              <button onClick={() => { setCity(""); setCategoryId(""); setSearch(""); setMinPrice(""); setMaxPrice(""); setMinRating(""); }}
                className="text-xs text-primary border border-primary/30 hover:bg-accent px-3 py-1.5 rounded-lg transition-colors">
                Resetează
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-white border border-border rounded-2xl shadow-card">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Preț minim (lei)</label>
              <input type="number" min={0} value={minPrice} onChange={e => setMinPrice(e.target.value)}
                placeholder="0" className="w-28 px-3 py-1.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Preț maxim (lei)</label>
              <input type="number" min={0} value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                placeholder="Fără limită" className="w-32 px-3 py-1.5 text-sm rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Rating minim</label>
              <Select value={minRating || "__any"} onValueChange={v => setMinRating(v === "__any" ? "" : v)}>
                <SelectTrigger className="w-36 h-auto py-1.5 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any">Orice rating</SelectItem>
                  <SelectItem value="4.5">4.5+ ★</SelectItem>
                  <SelectItem value="4">4+ ★</SelectItem>
                  <SelectItem value="3">3+ ★</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Listings grid / map */}
        {view === "map" && !isLoading ? (
          <ListingsMap listings={filtered} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse shadow-card">
                <div className="h-4 bg-muted rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-2 pt-3 border-t border-border"><div className="h-3 bg-muted rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Niciun anunț găsit"
            description="Încearcă alte filtre sau fii primul care postează un serviciu în această zonă."
            action={
              <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                Postează primul anunț <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing}
                isFav={favIds.includes(listing.id)}
                onToggleFav={user ? () => toggleFav.mutate({ id: listing.id, isFav: favIds.includes(listing.id) }) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-blue-700 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ai un serviciu sau o afacere locală?</h2>
          <p className="text-blue-100/80 mb-8 max-w-lg mx-auto">Listează-te gratuit și ajunge la mii de clienți din orașul tău. Upgrade oricând la cont de firmă.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
              Creează cont gratuit <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/despre" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20">
              Află mai multe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ListingCard({ listing, isFav, onToggleFav }: { listing: Listing; isFav?: boolean; onToggleFav?: () => void }) {
  const isBusiness = listing.owner.businessType !== "none";
  const isCompany = listing.owner.businessType === "company";
  const hasCover = listing.images?.length > 0;
  const now = new Date();
  const isPromotedNow = listing.isPromoted && listing.promotedUntil && new Date(listing.promotedUntil) > now;

  return (
    <div className="relative group bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {/* Promoted badge */}
      {isPromotedNow && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full shadow-sm">
            <Zap className="h-3 w-3" />Promovat
          </span>
        </div>
      )}

      {/* Favorite button */}
      {onToggleFav && (
        <button onClick={(e) => { e.preventDefault(); onToggleFav(); }}
          className={`absolute z-10 p-1.5 rounded-lg transition-colors ${hasCover ? "top-2 right-2 bg-white/90" : "top-3 right-3 bg-white"} ${isFav ? "text-pink-500 hover:bg-pink-50" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-50 opacity-0 group-hover:opacity-100"}`}
          title={isFav ? "Elimină din favorite" : "Salvează la favorite"}>
          <Heart className={`h-4 w-4 transition-all ${isFav ? "fill-pink-500" : ""}`} />
        </button>
      )}

      <Link to={`/listing/${listing.id}`} className="flex flex-col flex-1">
        {hasCover ? (
          <div className="relative w-full h-40 overflow-hidden">
            <img src={listing.images[0]} alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {listing.category && (
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                  <Tag className="h-3 w-3" />{listing.category.name}
                </span>
              </div>
            )}
            {isCompany && (
              <div className="absolute bottom-2 right-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50/95 px-2 py-0.5 rounded-full shadow-sm">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-5 pt-5 pr-10">
            {listing.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" />{listing.category.name}
              </span>
            )}
            {isCompany && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă
              </span>
            )}
          </div>
        )}

        <div className={`flex flex-col flex-1 px-5 pb-5 ${hasCover ? "pt-4" : "pt-3"}`}>
          <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 flex-wrap">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            {isBusiness && listing.owner.businessName ? listing.owner.businessName : listing.owner.name}
            {listing.owner.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                <BadgeCheck className="h-3 w-3" />Verificat
              </span>
            )}
          </p>
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{listing.description}</p>
          )}
          {listing.ratingAvg && listing.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2 text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{Number(listing.ratingAvg).toFixed(1)}</span>
              <span className="text-muted-foreground">({listing.reviewCount})</span>
            </div>
          )}
          <div className="flex-1" />
          {listing.price && (
            <div className="mb-3">
              <span className="text-lg font-extrabold text-foreground">
                {listing.price} <span className="text-sm font-normal text-muted-foreground">lei</span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />{listing.city}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Phone className="h-3 w-3" />{listing.phone}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
