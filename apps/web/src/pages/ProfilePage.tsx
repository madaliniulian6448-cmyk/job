import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  MapPin, Phone, Building2, Star, Calendar,
  Tag, ArrowLeft, User, Briefcase, BadgeCheck,
  Share2, Check, MessageSquare, Image as ImageIcon,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PageSpinner } from "../components/ui/spinner";
import { EmptyState } from "../components/ui/empty-state";

interface PublicUser {
  id: number;
  name: string;
  email: string;
  city: string | null;
  phone: string | null;
  role: string;
  businessType: "none" | "private" | "company";
  businessStatus: string;
  businessName: string | null;
  businessDescription: string | null;
  paidUntil: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  isActive: boolean;
  createdAt: string;
  category: { id: number; name: string; slug: string } | null;
}

interface ProfileReview {
  id: number;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  author: { id: number; name: string };
  listing: { id: number; title: string };
}

interface ProfileStats {
  totalListings: number;
  activeListings: number;
  avgRating: number | null;
  reviewCount: number;
  categories: { id: number; name: string; slug: string }[];
  gallery: string[];
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [tab, setTab] = useState<"listings" | "reviews">("listings");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => apiFetch(`/profile/${id}`),
  });

  const profile: PublicUser | undefined = data?.user;
  const listings: Listing[] = data?.listings ?? [];
  const reviews: ProfileReview[] = data?.reviews ?? [];
  const stats: ProfileStats | undefined = data?.stats;
  const activeListings = listings.filter((l) => l.isActive);

  const isBusiness = profile?.businessType !== "none";
  const isApprovedBusiness = isBusiness && profile?.businessStatus === "approved";
  const isPaid = profile?.paidUntil && new Date(profile.paidUntil) > new Date();
  const isVisibleBusiness = isApprovedBusiness && isPaid;
  const isMe = me?.id === profile?.id;

  if (isLoading) return <PageSpinner />;

  if (isError || !profile) return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <EmptyState
        icon={User}
        title="Profil negăsit"
        description="Profilul căutat nu există sau a fost șters."
        action={<Link to="/" className="text-primary text-sm font-semibold hover:underline">← Înapoi acasă</Link>}
      />
    </div>
  );

  const joinDate = new Date(profile.createdAt).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (unsupported browser, permissions); ignore silently.
    }
  };

  const metaTitle = isVisibleBusiness && profile.businessName
    ? `${profile.businessName} — ${profile.city ?? "ServiciiLocale"} | ServiciiLocale`
    : `${profile.name} | ServiciiLocale`;
  const metaDescription = isVisibleBusiness
    ? (profile.businessDescription || `Servicii oferite de ${profile.businessName ?? profile.name} în ${profile.city ?? "România"}.`).slice(0, 160)
    : `Profilul lui ${profile.name} pe ServiciiLocale.`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
      </Helmet>

      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Înapoi
      </Link>

      {/* Cover + header */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden mb-6">
        <div className={`relative h-28 sm:h-32 ${isVisibleBusiness && profile.businessType === "company" ? "bg-gradient-to-br from-amber-400 via-orange-400 to-primary" : "bg-gradient-to-br from-primary via-blue-600 to-blue-700"}`}>
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          />
          {/* Toolbar — actions live on the cover, decoupled from the identity row below */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copiat" : "Distribuie"}
            </button>
            {isMe && (
              <Link to="/settings"
                className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors">
                Editează profilul
              </Link>
            )}
          </div>
        </div>

        <div className="relative z-10 px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 -mt-10">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg ring-4 ring-white flex-shrink-0">
                <span className="text-2xl font-extrabold text-white">{profile.name[0].toUpperCase()}</span>
              </div>
              {/* Anchored a fixed distance below the row's top (which sits -mt-10 into
                  the cover) so the name always clears the cover/white boundary, even
                  when the business badge beneath it makes this block taller than half
                  the avatar — otherwise the text straddles the seam and looks clipped. */}
              <div className="mt-11">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xl font-extrabold text-foreground">{profile.name}</h1>
                  {profile.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-primary" aria-label="Cont verificat" />
                  )}
                </div>
                {isVisibleBusiness && (
                  <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${profile.businessType === "company" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                    {profile.businessType === "company"
                      ? <><Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă înregistrată</>
                      : <><Briefcase className="h-3 w-3" />Firmă privată</>}
                  </div>
                )}
              </div>
            </div>

            {stats && stats.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl self-start sm:self-auto">
                <Stars value={stats.avgRating ?? 0} />
                <span className="text-sm font-bold">{stats.avgRating}</span>
                <span className="text-xs text-muted-foreground">({stats.reviewCount} recenzii)</span>
              </div>
            )}
          </div>

          {profile.businessName && isVisibleBusiness && (
            <p className="text-sm font-semibold text-primary mt-4">{profile.businessName}</p>
          )}
          {profile.businessDescription && isVisibleBusiness && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">{profile.businessDescription}</p>
          )}

          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {profile.city && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{profile.city}</span>
              </div>
            )}
            {profile.phone && isVisibleBusiness && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${profile.phone}`} className="text-primary hover:underline font-medium">{profile.phone}</a>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Membru din {joinDate}</span>
            </div>
          </div>

          {isVisibleBusiness && stats && stats.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.categories.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full">
                  <Tag className="h-3 w-3" />{c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isVisibleBusiness ? (
        <EmptyState
          icon={User}
          title="Cont utilizator"
          description="Acest utilizator nu are o firmă activă pe platformă."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — stats + gallery */}
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-border shadow-card p-5">
              <h3 className="font-bold text-sm mb-3">Statistici</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Anunțuri active</span>
                  <span className="font-bold text-foreground">{stats?.activeListings ?? activeListings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total anunțuri</span>
                  <span className="font-bold text-foreground">{stats?.totalListings ?? listings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recenzii primite</span>
                  <span className="font-bold text-foreground">{stats?.reviewCount ?? 0}</span>
                </div>
                {stats && stats.avgRating !== null && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Rating mediu</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{stats.avgRating}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {stats && stats.gallery.length > 0 && (
              <div className="bg-white rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />Galerie
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {stats.gallery.map((src, i) => (
                    <img key={i} src={src} alt={`Fotografie din anunțurile lui ${profile.name}`} className="aspect-square w-full rounded-lg object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — tabs: listings / reviews */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="flex items-center gap-1 mb-4 bg-secondary rounded-xl p-1 w-fit">
              <button
                onClick={() => setTab("listings")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === "listings" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Anunțuri ({activeListings.length})
              </button>
              <button
                onClick={() => setTab("reviews")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === "reviews" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Recenzii ({stats?.reviewCount ?? 0})
              </button>
            </div>

            {tab === "listings" ? (
              activeListings.length === 0 ? (
                <EmptyState icon={Building2} title="Niciun anunț activ" />
              ) : (
                <div className="space-y-3">
                  {activeListings.map((listing) => (
                    <Link key={listing.id} to={`/listing/${listing.id}`}
                      className="bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all p-5 flex items-start gap-4 group block">
                      <div className="flex-1 min-w-0">
                        {listing.category && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full mb-2">
                            <Tag className="h-3 w-3" />{listing.category.name}
                          </span>
                        )}
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
                        {listing.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{listing.description}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.city}</span>
                          {listing.price && <span className="font-semibold text-foreground">{listing.price} lei</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : reviews.length === 0 ? (
              <EmptyState icon={MessageSquare} title="Nicio recenzie încă" description="Acest utilizator nu a primit încă recenzii pe anunțurile sale." />
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-border shadow-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">{r.author.name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.author.name}</p>
                          <Stars value={r.rating} size="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(r.createdAt).toLocaleDateString("ro-RO")}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-foreground mt-3 leading-relaxed">{r.comment}</p>}
                    <Link to={`/listing/${r.listing.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium">
                      <Tag className="h-3 w-3" />{r.listing.title}
                    </Link>
                    {r.reply && (
                      <div className="mt-3 bg-secondary rounded-xl p-3 text-sm">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Răspunsul firmei</p>
                        <p className="text-foreground">{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
