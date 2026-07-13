import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  MapPin,
  Phone,
  Tag,
  Heart,
  Building2,
  ChevronRight,
  Zap,
  BadgeCheck,
  Star,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  ArrowUpDown,
} from "lucide-react";
import NotFoundPage from "./NotFoundPage";
import ListingsMap from "../components/ListingsMap";
import { Helmet } from "react-helmet-async";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { PageSpinner } from "../components/ui/spinner";
import { EmptyState } from "../components/ui/empty-state";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  images: string[];
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

// Slug → display name mapping
export const CITY_SLUGS: Record<string, string> = {
  bucuresti: "București",
  "cluj-napoca": "Cluj-Napoca",
  timisoara: "Timișoara",
  iasi: "Iași",
  constanta: "Constanța",
  craiova: "Craiova",
  brasov: "Brașov",
  galati: "Galați",
  ploiesti: "Ploiești",
  oradea: "Oradea",
  arad: "Arad",
  pitesti: "Pitești",
  sibiu: "Sibiu",
  bacau: "Bacău",
  "targu-mures": "Târgu Mureș",
};

export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .replace(/\s+/g, "-");
}

function parseSlug(
  slug: string,
  cats: Category[]
): { category: Category | null; city: string | null } {
  for (const cat of cats) {
    if (slug === cat.slug) return { category: cat, city: null };
    if (slug.startsWith(cat.slug + "-")) {
      const citySlug = slug.slice(cat.slug.length + 1);
      const city = CITY_SLUGS[citySlug] ?? null;
      return { category: cat, city };
    }
  }
  return { category: null, city: null };
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const { data: catData, isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });
  const allCategories: Category[] = catData?.categories ?? [];

  const { category, city } = parseSlug(slug ?? "", allCategories);

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings-cat", category?.id, city, minPrice, maxPrice, minRating, sort],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set("categoryId", String(category.id));
      if (city) params.set("city", city);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);
      return apiFetch(`/listings?${params}`);
    },
    enabled: !!category,
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
        ids: isFav
          ? prev!.ids.filter((x) => x !== id)
          : [...(prev?.ids ?? []), id],
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["favorite-ids"], ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
  });

  const listings: Listing[] = listingsData?.listings ?? [];

  const pageTitle = category
    ? city
      ? `${category.name} în ${city} — ServiciiLocale`
      : `${category.name} — ServiciiLocale`
    : "ServiciiLocale";
  const pageDescription = category
    ? city
      ? `Găsește ${category.name.toLowerCase()} verificați în ${city}. Compară prețuri, recenzii și contactează direct furnizorii locali.`
      : `Găsește ${category.name.toLowerCase()} verificați din toată România. Compară prețuri, recenzii și contactează direct furnizorii locali.`
    : "Platforma #1 pentru servicii locale în România.";

  function clearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSort("newest");
  }

  const activeFilterCount = [minPrice, maxPrice, minRating].filter(Boolean).length;

  if (loadingCats) {
    return <PageSpinner />;
  }

  if (!category) return <NotFoundPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary transition-colors">
          Acasă
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          to={`/${category.slug}`}
          className="hover:text-primary transition-colors"
        >
          {category.name}
        </Link>
        {city && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{city}</span>
          </>
        )}
      </nav>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground">
          {category.name}
          {city ? (
            <span className="text-primary"> în {city}</span>
          ) : null}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLoading
            ? "Se încarcă..."
            : `${listings.length} ${
                listings.length === 1 ? "anunț disponibil" : "anunțuri disponibile"
              }`}
        </p>
      </div>

      {/* City filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          to={`/${category.slug}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !city
              ? "bg-primary text-white border-primary"
              : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          Toate orașele
        </Link>
        {Object.entries(CITY_SLUGS).map(([cs, name]) => (
          <Link
            key={cs}
            to={`/${category.slug}-${cs}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              city === name
                ? "bg-primary text-white border-primary"
                : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {name}
          </Link>
        ))}
      </div>

      {/* Filters + sort + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtre
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-auto h-[38px] gap-1.5 rounded-xl border-border text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Cele mai noi</SelectItem>
              <SelectItem value="price_asc">Preț crescător</SelectItem>
              <SelectItem value="price_desc">Preț descrescător</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List / Map toggle */}
        <div className="inline-flex items-center rounded-xl border border-border bg-white p-1">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            Listă
          </button>
          <button
            onClick={() => setView("map")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === "map" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Hartă
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-5 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preț minim (lei)</label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-32 border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preț maxim (lei)</label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Fără limită"
              className="w-32 border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Rating minim</label>
            <Select value={minRating || "any"} onValueChange={(v) => setMinRating(v === "any" ? "" : v)}>
              <SelectTrigger className="w-36 h-[38px] rounded-xl border-2 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Orice rating</SelectItem>
                <SelectItem value="4.5">4.5+ <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /></SelectItem>
                <SelectItem value="4">4+ <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /></SelectItem>
                <SelectItem value="3">3+ <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /></SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors pb-2.5"
            >
              Șterge filtrele
            </button>
          )}
        </div>
      )}

      {/* Listing grid / map */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-5 animate-pulse shadow-card"
            >
              <div className="h-4 bg-muted rounded-lg w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-4" />
              <div className="flex gap-2 pt-3 border-t border-border">
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Niciun anunț găsit"
          description={`Nu există anunțuri pentru ${category.name}${city ? ` în ${city}` : ""} momentan.`}
        />
      ) : view === "map" ? (
        <ListingsMap listings={listings} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <CatListingCard
              key={listing.id}
              listing={listing}
              isFav={favIds.includes(listing.id)}
              onToggleFav={
                user
                  ? () =>
                      toggleFav.mutate({
                        id: listing.id,
                        isFav: favIds.includes(listing.id),
                      })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CatListingCard({
  listing,
  isFav,
  onToggleFav,
}: {
  listing: Listing;
  isFav?: boolean;
  onToggleFav?: () => void;
}) {
  const now = new Date();
  const isPromotedNow =
    listing.isPromoted &&
    listing.promotedUntil &&
    new Date(listing.promotedUntil) > now;
  const hasCover = listing.images?.length > 0;
  const isBusiness = listing.owner.businessType !== "none";

  return (
    <div className="relative group bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {isPromotedNow && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full shadow-sm">
            <Zap className="h-3 w-3" />
            Promovat
          </span>
        </div>
      )}

      {onToggleFav && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFav();
          }}
          className={`absolute z-10 p-1.5 rounded-lg transition-colors ${
            hasCover ? "top-2 right-2 bg-white/90" : "top-3 right-3 bg-white"
          } ${
            isFav
              ? "text-pink-500 hover:bg-pink-50"
              : "text-muted-foreground hover:text-pink-500 hover:bg-pink-50 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`h-4 w-4 transition-all ${isFav ? "fill-pink-500" : ""}`} />
        </button>
      )}

      <Link to={`/listing/${listing.id}`} className="flex flex-col flex-1">
        {hasCover ? (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {listing.category && (
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-white/95 px-2 py-0.5 rounded-full shadow-sm">
                  <Tag className="h-3 w-3" />
                  {listing.category.name}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-5 pt-5 pr-10">
            {listing.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" />
                {listing.category.name}
              </span>
            )}
          </div>
        )}

        <div
          className={`flex flex-col flex-1 px-5 pb-5 ${hasCover ? "pt-4" : "pt-3"}`}
        >
          <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 flex-wrap">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            {isBusiness && listing.owner.businessName
              ? listing.owner.businessName
              : listing.owner.name}
            {listing.owner.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                <BadgeCheck className="h-3 w-3" />
                Verificat
              </span>
            )}
          </p>
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {listing.description}
            </p>
          )}
          <div className="flex-1" />
          {listing.price && (
            <div className="mb-3">
              <span className="text-lg font-extrabold text-foreground">
                {listing.price}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  lei
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {listing.city}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Phone className="h-3 w-3" />
              {listing.phone}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
