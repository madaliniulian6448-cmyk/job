import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  MapPin, Phone, Building2, Star, Calendar,
  Tag, ArrowLeft, User, Briefcase, CheckCircle
} from "lucide-react";
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

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => apiFetch(`/profile/${id}`),
  });

  const profile: PublicUser | undefined = data?.user;
  const listings: Listing[] = data?.listings ?? [];
  const activeListings = listings.filter(l => l.isActive);

  const isBusiness = profile?.businessType !== "none";
  const isApprovedBusiness = isBusiness && profile?.businessStatus === "approved";
  const isPaid = profile?.paidUntil && new Date(profile.paidUntil) > new Date();
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Înapoi
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 text-center">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-2xl font-extrabold text-white">{profile.name[0].toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-extrabold text-foreground">{profile.name}</h1>

            {/* Business badge */}
            {isApprovedBusiness && isPaid && (
              <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${profile.businessType === "company" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                {profile.businessType === "company"
                  ? <><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />Firmă înregistrată</>
                  : <><Briefcase className="h-3.5 w-3.5" />Firmă privată</>
                }
              </div>
            )}

            {profile.businessName && isApprovedBusiness && isPaid && (
              <p className="text-sm font-semibold text-primary mt-2">{profile.businessName}</p>
            )}

            {profile.businessDescription && isApprovedBusiness && isPaid && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.businessDescription}</p>
            )}

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm text-left">
              {profile.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{profile.city}</span>
                </div>
              )}
              {profile.phone && isApprovedBusiness && isPaid && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="text-primary hover:underline font-medium">{profile.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Membru din {joinDate}</span>
              </div>
            </div>

            {isMe && (
              <Link to="/settings"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 border-2 border-border text-sm font-semibold px-4 py-2 rounded-xl hover:bg-secondary transition-colors">
                Editează profilul
              </Link>
            )}
          </div>

          {/* Stats */}
          {isApprovedBusiness && isPaid && (
            <div className="bg-white rounded-2xl border border-border shadow-card p-5">
              <h3 className="font-bold text-sm mb-3">Statistici</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Anunțuri active</span>
                  <span className="font-bold text-foreground">{activeListings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total anunțuri</span>
                  <span className="font-bold text-foreground">{listings.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — listings */}
        <div className="lg:col-span-2">
          {isApprovedBusiness && isPaid ? (
            <>
              <h2 className="font-bold text-lg mb-4">
                Anunțuri active <span className="text-muted-foreground font-normal text-base">({activeListings.length})</span>
              </h2>
              {activeListings.length === 0 ? (
                <EmptyState icon={Building2} title="Niciun anunț activ" />
              ) : (
                <div className="space-y-3">
                  {activeListings.map(listing => (
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
              )}
            </>
          ) : (
            <EmptyState
              icon={User}
              title="Cont utilizator"
              description="Acest utilizator nu are o firmă activă pe platformă."
            />
          )}
        </div>
      </div>
    </div>
  );
}
