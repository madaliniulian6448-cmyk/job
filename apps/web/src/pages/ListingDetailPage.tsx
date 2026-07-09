import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  MapPin, Phone, Tag, Star, ArrowLeft, Building2,
  Calendar, User, Pencil, Trash2, Send, Briefcase
} from "lucide-react";

interface FullListing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  isActive: boolean;
  createdAt: string;
  userId: number;
  owner: {
    id: number;
    name: string;
    businessType: string;
    businessName: string | null;
    businessDescription: string | null;
    businessStatus: string;
    paidUntil: string | null;
    city: string | null;
    phone: string | null;
  };
  category: { id: number; name: string; slug: string } | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: number;
  author: { id: number; name: string };
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-muted-foreground">{label}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
        <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const { data: listingData, isLoading: loadingListing } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiFetch(`/listings/${id}`),
  });

  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => apiFetch(`/reviews/listing/${id}`),
  });

  const listing: FullListing | undefined = listingData?.listing;
  const reviews: Review[] = reviewsData?.reviews ?? [];
  const avgRating: number | null = reviewsData?.avgRating ?? null;
  const totalCount: number = reviewsData?.totalCount ?? 0;

  const myReview = user ? reviews.find(r => r.userId === user.id) : null;
  const canReview = user && listing && listing.userId !== user.id && !myReview;

  // rating distribution
  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));

  const submitReview = useMutation({
    mutationFn: () => apiFetch(`/reviews/listing/${id}`, {
      method: "POST",
      body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      toast.success("Recenzie adăugată!");
      setComment("");
      setRating(5);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateReview = useMutation({
    mutationFn: () => apiFetch(`/reviews/listing/${id}/my`, {
      method: "PUT",
      body: JSON.stringify({ rating: editRating, comment: editComment.trim() || undefined }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      toast.success("Recenzie actualizată!");
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteReview = useMutation({
    mutationFn: () => apiFetch(`/reviews/listing/${id}/my`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      toast.success("Recenzie ștearsă");
    },
    onError: (err: any) => toast.error(err.message),
  });

  function startEdit(r: Review) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment || "");
  }

  if (loadingListing) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!listing) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="font-bold text-lg">Anunțul nu a fost găsit</h2>
      <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">← Înapoi acasă</Link>
    </div>
  );

  const isOwner = user?.id === listing.userId;
  const isBusiness = listing.owner.businessType !== "none";
  const isCompany = listing.owner.businessType === "company";
  const createdDate = new Date(listing.createdAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Înapoi
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Listing card */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                {listing.category && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full mb-2">
                    <Tag className="h-3 w-3" />{listing.category.name}
                  </span>
                )}
                <h1 className="text-2xl font-extrabold text-foreground leading-tight">{listing.title}</h1>
                {isBusiness && listing.owner.businessName && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isCompany ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                      {isCompany ? <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> : <Briefcase className="h-3 w-3" />}
                      {listing.owner.businessName}
                    </div>
                  </div>
                )}
              </div>
              {listing.price && (
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-extrabold text-foreground">{listing.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">lei</span>
                </div>
              )}
            </div>

            {listing.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">{listing.description}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t border-border/60 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />{listing.city}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />{createdDate}
              </span>
              {avgRating !== null && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating} ({totalCount} {totalCount === 1 ? "recenzie" : "recenzii"})
                </span>
              )}
            </div>
          </div>

          {/* Reviews section */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6">
            <h2 className="font-bold text-lg mb-5">Recenzii <span className="text-muted-foreground font-normal text-base">({totalCount})</span></h2>

            {/* Rating overview */}
            {totalCount > 0 && (
              <div className="flex gap-6 mb-6 p-4 bg-secondary/50 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-foreground">{avgRating}</div>
                  <StarRating value={Math.round(avgRating!)} readonly />
                  <div className="text-xs text-muted-foreground mt-1">{totalCount} {totalCount === 1 ? "recenzie" : "recenzii"}</div>
                </div>
                <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                  {dist.map(({ star, count }) => (
                    <RatingBar key={star} label={String(star)} count={count} total={totalCount} />
                  ))}
                </div>
              </div>
            )}

            {/* Add review form */}
            {canReview && (
              <div className="mb-6 p-5 bg-accent/30 rounded-xl border border-accent">
                <h3 className="font-semibold text-sm mb-3">Lasă o recenzie</h3>
                <form onSubmit={e => { e.preventDefault(); submitReview.mutate(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Rating *</label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Comentariu (opțional)</label>
                    <textarea
                      value={comment} onChange={e => setComment(e.target.value)} rows={3}
                      className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none bg-white"
                      placeholder="Descrie experiența ta..."
                    />
                  </div>
                  <button type="submit" disabled={submitReview.isPending}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
                    <Send className="h-3.5 w-3.5" />
                    {submitReview.isPending ? "Se trimite..." : "Trimite recenzia"}
                  </button>
                </form>
              </div>
            )}

            {!user && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-xl text-sm text-center text-muted-foreground">
                <Link to="/login" className="text-primary font-semibold hover:underline">Conectează-te</Link> pentru a lăsa o recenzie
              </div>
            )}

            {isOwner && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-xl text-sm text-center text-muted-foreground">
                Nu poți recenza propriul anunț
              </div>
            )}

            {/* Reviews list */}
            {loadingReviews ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-secondary/50 rounded-xl animate-pulse" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nicio recenzie încă. Fii primul!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => {
                  const isMyReview = user?.id === r.userId;
                  const isEditing = editingId === r.id;
                  const date = new Date(r.createdAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
                  return (
                    <div key={r.id} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{r.author.name[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <Link to={`/profile/${r.author.id}`} className="text-sm font-semibold hover:text-primary transition-colors">
                              {r.author.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StarRating value={r.rating} readonly />
                              <span className="text-xs text-muted-foreground">{date}</span>
                            </div>
                          </div>
                        </div>
                        {isMyReview && !isEditing && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => startEdit(r)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { if (confirm("Ștergi recenzia?")) deleteReview.mutate(); }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="mt-3 pl-10 space-y-2">
                          <StarRating value={editRating} onChange={setEditRating} />
                          <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={2}
                            className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => updateReview.mutate()} disabled={updateReview.isPending}
                              className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50">
                              Salvează
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="text-xs font-semibold border border-border px-3 py-1.5 rounded-lg hover:bg-secondary">
                              Anulează
                            </button>
                          </div>
                        </div>
                      ) : r.comment ? (
                        <p className="mt-2 pl-10 text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — appears first on mobile, right column on desktop */}
        <div className="lg:col-span-1 space-y-4 order-first lg:order-none">
          {/* Contact card */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-bold text-sm mb-4">Contact</h3>
            <a href={`tel:${listing.phone}`}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm mb-3">
              <Phone className="h-4 w-4" />{listing.phone}
            </a>
            {listing.owner.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <MapPin className="h-4 w-4" />{listing.city}
              </div>
            )}
          </div>

          {/* Owner card */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-bold text-sm mb-4">Postat de</h3>
            <Link to={`/profile/${listing.owner.id}`} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{listing.owner.name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{listing.owner.name}</p>
                {isBusiness && listing.owner.businessName && (
                  <p className="text-xs text-muted-foreground">{listing.owner.businessName}</p>
                )}
              </div>
            </Link>
            {listing.owner.businessDescription && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">{listing.owner.businessDescription}</p>
            )}
            <Link to={`/profile/${listing.owner.id}`}
              className="mt-3 w-full inline-flex items-center justify-center text-xs font-semibold text-primary border border-primary/30 hover:bg-accent px-3 py-2 rounded-xl transition-colors">
              Vezi profilul complet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
