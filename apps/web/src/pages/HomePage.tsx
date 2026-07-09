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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-blue-100 mb-6 border border-white/20">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Platforma #1 pentru servicii locale în România
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-balance leading-tight">
              Găsește servicii locale<br />
              <span className="text-blue-300">din orașul tău</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-xl leading-relaxed">
              Mâncare gătită acasă, frizeri, meșteri, transport — totul local, totul verificat.
            </p>

            {/* Search bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col sm:flex-row gap-2 border border-white/20 shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Caută servicii, firme..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder-white/50 rounded-xl border border-white/10 focus:outline-none focus:border-white/40 text-sm font-medium"
                />
              </div>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="sm:w-48 px-4 py-3 bg-white/10 text-white rounded-xl border border-white/10 focus:outline-none focus:border-white/40 text-sm font-medium appearance-none"
              >
                <option value="" className="text-foreground">Toate orașele</option>
                {CITIES.filter(c => c).map(c => <option key={c} value={c} className="text-foreground">{c}</option>)}
              </select>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
                <Search className="h-4 w-4" />
                Caută
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Users className="h-4 w-4" />, val: "500+", label: "Utilizatori activi" },
                { icon: <Briefcase className="h-4 w-4" />, val: "200+", label: "Firme locale" },
                { icon: <MapPin className="h-4 w-4" />, val: "20+", label: "Orașe acoperite" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="text-blue-300">{stat.icon}</div>
                  <div>
                    <div className="text-base font-bold text-white">{stat.val}</div>
                    <div className="text-xs text-blue-200/70">{stat.label}</div>
                  </div>
                </div>
              ))}
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
