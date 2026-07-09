import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import { Heart, MapPin, Phone, Tag, Building2, Star, Trash2 } from "lucide-react";

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  favoritedAt: string;
  owner: { id: number; name: string; businessType: string; businessName: string | null };
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
          {isLoading ? "Se încarcă..." : `${favorites.length} ${favorites.length === 1 ? "anunț salvat" : "anunțuri salvate"}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
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
          {favorites.map((listing) => (
            <div key={listing.id} className="relative group bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
              {/* Remove button */}
              <button
                onClick={() => removeMutation.mutate(listing.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors z-10"
                title="Elimină din favorite"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <Link to={`/listing/${listing.id}`} className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3 pr-8">
                  {listing.category && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full">
                      <Tag className="h-3 w-3" />{listing.category.name}
                    </span>
                  )}
                  {listing.owner.businessType === "company" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-foreground text-base mb-1 hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {listing.title}
                </h3>

                {listing.owner.businessType !== "none" && listing.owner.businessName && (
                  <p className="text-xs font-semibold text-primary/80 mb-2 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />{listing.owner.businessName}
                  </p>
                )}

                {listing.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed flex-1">
                    {listing.description}
                  </p>
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
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
