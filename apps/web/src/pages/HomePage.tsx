import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";
import {
  MapPin, Phone, Tag, Search, Building2, Star,
  Utensils, Scissors, Wrench, Truck, Heart, BookOpen,
  ArrowRight, CheckCircle, Users, Briefcase, Sparkles, Leaf
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

  const listings: Listing[] = listingsData?.listings ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];

  const filtered = search.trim()
    ? listings.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.owner.businessName?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/95 to-blue-900 text-white">
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-0 md:pt-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pb-16 md:pb-24">

            {/* Left column */}
            <div>
              <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white mb-8 border border-white/25 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" style={{ boxShadow: "0 0 6px #34d399" }} />
                Platforma #1 pentru servicii locale în România
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.08]">
                Găsește servicii<br />
                <span className="text-blue-300">locale acum</span>
              </h1>

              <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
                Mâncare gătită acasă, frizeri, meșteri, transport —<br className="hidden sm:block" /> totul local, totul verificat.
              </p>

              {/* White search card */}
              <div className="bg-white rounded-2xl p-1.5 flex flex-col sm:flex-row gap-1 shadow-[0_8px_40px_rgba(59,130,246,0.35)]">
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
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right column — decorative service cards (desktop only) */}
            <div className="hidden lg:block relative h-[400px]">
              {/* Card 1 */}
              <div className="absolute top-6 left-10 w-56 rounded-2xl p-4"
                style={{ transform: "rotate(-3deg)", background: "rgba(15,23,60,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/30 flex items-center justify-center text-orange-300 shrink-0">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Mâncare acasă</div>
                    <div className="text-xs text-blue-200/70">Andreea C. · București</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs text-blue-200/70 ml-1">5.0</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">50 RON</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="absolute top-2 right-6 w-52 rounded-2xl p-4"
                style={{ transform: "rotate(2.5deg)", background: "rgba(15,23,60,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Frizerie Pro</div>
                    <div className="text-xs text-blue-200/70">Salon Elite · Cluj</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <Star className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-blue-200/70 ml-1">4.8</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">35 RON</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="absolute bottom-16 left-4 w-52 rounded-2xl p-4"
                style={{ transform: "rotate(1.5deg)", background: "rgba(15,23,60,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/30 flex items-center justify-center text-sky-300 shrink-0">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Reparații rapide</div>
                    <div className="text-xs text-blue-200/70">Mihai R. · Timișoara</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs text-blue-200/70 ml-1">4.9</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">80 RON</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="absolute bottom-8 right-4 w-48 rounded-2xl p-4"
                style={{ transform: "rotate(-2deg)", background: "rgba(15,23,60,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center text-green-300 shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Transport</div>
                    <div className="text-xs text-blue-200/70">Cluj Express</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                    <Star className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-blue-200/70 ml-1">4.7</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">120 RON</span>
                </div>
              </div>

              {/* Centre glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-500 blur-3xl opacity-20 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/20" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/25 text-blue-300"><Users className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-white tracking-tight">500+</div>
                  <div className="text-xs text-blue-200/70">Utilizatori activi</div>
                </div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/25 text-purple-300"><Briefcase className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-white tracking-tight">200+</div>
                  <div className="text-xs text-blue-200/70">Firme locale</div>
                </div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/25 text-emerald-300"><MapPin className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-extrabold text-white tracking-tight">20+</div>
                  <div className="text-xs text-blue-200/70">Orașe acoperite</div>
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
        <div className="flex items-center justify-between mb-6">
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
          {(city || categoryId || search) && (
            <button
              onClick={() => { setCity(""); setCategoryId(""); setSearch(""); }}
              className="text-xs text-primary border border-primary/30 hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
            >
              Resetează
            </button>
          )}
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
              <ListingCard key={listing.id} listing={listing} />
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

function ListingCard({ listing }: { listing: Listing }) {
  const isBusiness = listing.owner.businessType !== "none";
  const isCompany = listing.owner.businessType === "company";

  return (
    <Link to={`/listing/${listing.id}`} className="group bg-white rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col block">
      {/* Top badges */}
      <div className="flex items-center gap-2 mb-3">
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
  );
}
