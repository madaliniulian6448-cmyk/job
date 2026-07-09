import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import {
  Heart, MapPin, Phone, Tag, Building2, Star, X, Zap, BadgeCheck,
} from "lucide-react";

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
  favoritedAt: string;
  owner: {
    id: number;
    name: string;
    businessType: string;
    businessName: string | null;
    isVerified: boolean;
  };
  category: { id: number; name: string; slug: string } | null;
}

export default function FavoritesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiFetch("/favorites"),
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: number) =>
      apiFetch(`/favorites/${listingId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
      toast.success("Eliminat din favorite");
    },
  });

  const favorites: Listing[] = data?.favorites ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500 fill-pink-500" /> Anunțuri salvate
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLoading
            ? "Se încarcă..."
            : `${favorites.length} ${favorites.length === 1 ? "anunț salvat" : "anunțuri salvate"}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border animate-pulse shadow-card overflow-hidden">
              <div className="h-40 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-card">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-pink-300" />
          </div>
          <h3 className="font-bold text-lg mb-2">Niciun anunț salvat</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Apasă iconița ♥ pe orice anunț pentru a-l salva aici.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Explorează anunțuri
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((listing) => {
            const now = new Date();
            const isPromotedNow =
              listing.isPromoted &&
              listing.promotedUntil &&
              new Date(listing.promotedUntil) > now;
            const hasCover = listing.images?.length > 0;
            const isBusiness = listing.owner.businessType !== "none";
            const isCompany = listing.owner.businessType === "company";

            return (
              <div
                key={listing.id}
                className="relative group bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden"
              >
                {/* Promoted badge */}
                {isPromotedNow && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full shadow-sm">
                      <Zap className="h-3 w-3" />Promovat
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeMutation.mutate(listing.id)}
                  disabled={removeMutation.isPending}
                  className={`absolute z-10 p-1.5 rounded-lg bg-white/90 text-pink-500 hover:bg-pink-50 transition-colors ${hasCover ? "top-2 right-2" : "top-3 right-3"}`}
                  title="Elimină din favorite"
                >
                  <X className="h-4 w-4" />
                </button>

                <Link to={`/listing/${listing.id}`} className="flex flex-col flex-1">
                  {/* Cover image */}
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
                          <Tag className="h-3 w-3" />
                          {listing.category.name}
                        </span>
                      )}
                      {isCompany && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card body */}
                  <div className={`flex flex-col flex-1 px-5 pb-5 ${hasCover ? "pt-4" : "pt-3"}`}>
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
                          <BadgeCheck className="h-3 w-3" />Verificat
                        </span>
                      )}
                    </p>

                    {listing.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {listing.description}
                      </p>
                    )}

                    {/* Spacer pushes price + footer to bottom */}
                    <div className="flex-1" />

                    {listing.price && (
                      <div className="mb-3">
                        <span className="text-lg font-extrabold text-foreground">
                          {listing.price}{" "}
                          <span className="text-sm font-normal text-muted-foreground">lei</span>
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
          })}
        </div>
      )}
    </div>
  );
}
