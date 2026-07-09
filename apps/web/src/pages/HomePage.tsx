import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin, Phone, Tag, Search, Building2, Star,
  Utensils, Scissors, Wrench, Truck, Heart, BookOpen,
  ArrowRight, CheckCircle, Users, Briefcase, Sparkles, Leaf,
  ArrowUpDown
} from "lucide-react";

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
  createdAt: string;
  owner: {
    id: number;
    name: string;
    businessType: string;
    businessName: string | null;
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

  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings", city, categoryId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (categoryId) params.set("categoryId", categoryId);
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

  const filtered = [...textFiltered].sort((a, b) => {
    if (sort === "price_asc") return (parseFloat(a.price ?? "999999")) - (parseFloat(b.price ?? "999999"));
    if (sort === "price_desc") return (parseFloat(b.price ?? "0")) - (parseFloat(a.price ?? "0"));
    // newest (default)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-foreground">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, #1d4ed8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-0 md:pt-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pb-16 md:pb-24">

            {/* Left column */}
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

              {/* White search card */}
              <div className="bg-white rounded-2xl p-1.5 flex flex-col sm:flex-row gap-1 border border-slate-200 shadow-[0_8px_40px_rgba(59,130,246,0.15)]">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Caută servicii, firme..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-slate-700 placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none bg-transparent"
                  />
                </div>
                <div className="hidden sm:block w-px bg-slate-100 self-stretch my-1" />
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="sm:w-44 px-4 py-3 text-slate-600 rounded-xl text-sm font-medium focus:outline-none bg-transparent appearance-none cursor-pointer"
                >
                  <option value="">Toate orașele</option>
                  {CITIES.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/40">
                  <Search className="h-4 w-4" />
                  Caută
                </button>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 mt-5">
                {["Frizerie", "Meșteri", "Transport", "Mâncare", "Curățenie"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right column — decorative service cards (desktop only) */}
            <div className="hidden lg:block relative h-[400px]">
              {/* Card 1 */}
              <div className="absolute top-6 left-10 w-56 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(-3deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">Mâncare acasă</div>
                    <div className="text-xs text-slate-500">Andreea C. · București</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs text-slate-500 ml-1">5.0</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">50 RON</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="absolute top-2 right-6 w-52 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(2.5deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500 shrink-0">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">Frizerie Pro</div>
                    <div className="text-xs text-slate-500">Salon Elite · Cluj</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <Star className="h-3 w-3 text-slate-200" />
                    <span className="text-xs text-slate-500 ml-1">4.8</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">35 RON</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="absolute bottom-16 left-4 w-52 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(1.5deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">Reparații rapide</div>
                    <div className="text-xs text-slate-500">Mihai R. · Timișoara</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs text-slate-500 ml-1">4.9</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">80 RON</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="absolute bottom-8 right-4 w-48 rounded-2xl p-4 bg-white"
                style={{ transform: "rotate(-2deg)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 50px rgba(30,64,175,0.15)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-500 shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">Transport</div>
                    <div className="text-xs text-slate-500">Cluj Express</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <Star className="h-3 w-3 text-slate-200" />
                    <span className="text-xs text-slate-500 ml-1">4.7</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">120 RON</span>
                </div>
              </div>

              {/* Centre glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-300 blur-3xl opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-slate-200 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-primary"><Users className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900 tracking-tight">500+</div>
                  <div className="text-xs text-slate-500">Utilizatori activi</div>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600"><Briefcase className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900 tracking-tight">200+</div>
                  <div className="text-xs text-slate-500">Firme locale</div>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><MapPin className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900 tracking-tight">20+</div>
                  <div className="text-xs text-slate-500">Orașe acoperite</div>
                </div>
              </div>
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
              <button
                onClick={() => setCategoryId("")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${!categoryId ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                <Search className="h-3.5 w-3.5" />
                Toate categoriile
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(String(cat.id))}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${categoryId === String(cat.id) ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                >
                  {getCategoryIcon(cat.slug)}
                  {cat.name}
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
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-3 py-1.5 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="newest">Cele mai noi</option>
                <option value="price_asc">Preț crescător</option>
                <option value="price_desc">Preț descrescător</option>
              </select>
            </div>
            {(city || categoryId || search) && (
              <button
                onClick={() => { setCity(""); setCategoryId(""); setSearch(""); }}
                className="text-xs text-primary border border-primary/30 hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
              >
                Resetează
              </button>
            )}
          </div>
        </div>

        {/* Listings grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse shadow-card">
                <div className="h-4 bg-muted rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                <div className="flex gap-2 pt-3 border-t border-border">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-card">
            <div className="bg-secondary rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Niciun anunț găsit</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Încearcă alte filtre sau fii primul care postează un serviciu în această zonă.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              Postează primul anunț <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFav={favIds.includes(listing.id)}
                onToggleFav={user ? () => toggleFav.mutate({ id: listing.id, isFav: favIds.includes(listing.id) }) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-blue-700 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ai un serviciu sau o afacere locală?</h2>
          <p className="text-blue-100/80 mb-8 max-w-lg mx-auto">Listează-te gratuit și ajunge la mii de clienți din orașul tău. Upgrade oricând la cont de firmă.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
              Creează cont gratuit <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20">
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

  return (
    <div className="relative group bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Favorite button */}
      {onToggleFav && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFav(); }}
          className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors ${isFav ? "text-pink-500 bg-pink-50 hover:bg-pink-100" : "text-muted-foreground bg-white hover:text-pink-500 hover:bg-pink-50 opacity-0 group-hover:opacity-100"}`}
          title={isFav ? "Elimină din favorite" : "Salvează la favorite"}
        >
          <Heart className={`h-4 w-4 transition-all ${isFav ? "fill-pink-500" : ""}`} />
        </button>
      )}

      <Link to={`/listing/${listing.id}`} className="flex flex-col flex-1 p-5">
      {/* Top badges */}
      <div className="flex items-center gap-2 mb-3 pr-8">
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

      {/* Title */}
      <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
        {listing.title}
      </h3>

      {/* Business name */}
      {isBusiness && listing.owner.businessName && (
        <p className="text-xs font-semibold text-primary/80 mb-2 flex items-center gap-1">
          <Building2 className="h-3 w-3" />{listing.owner.businessName}
        </p>
      )}

      {/* Description */}
      {listing.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed flex-1">
          {listing.description}
        </p>
      )}

      <div className="flex-1" />

      {/* Price */}
      {listing.price && (
        <div className="mb-3">
          <span className="text-lg font-extrabold text-foreground">{listing.price} <span className="text-sm font-normal text-muted-foreground">lei</span></span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />{listing.city}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Phone className="h-3 w-3" />{listing.phone}
        </span>
      </div>
      </Link>
    </div>
  );
}
