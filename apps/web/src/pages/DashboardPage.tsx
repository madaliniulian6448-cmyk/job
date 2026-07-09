import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth, useInvalidateAuth } from "../lib/auth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Pencil, Trash2, ToggleLeft, ToggleRight, MapPin,
  Building2, Star, AlertCircle, CheckCircle, Clock, X,
  Phone, Tag, Eye, EyeOff, ArrowRight, Lock, Settings,
  ImagePlus, Briefcase, CreditCard
} from "lucide-react";

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  isActive: boolean;
  categoryId: number | null;
  images: string[];
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
  "Craiova", "Brașov", "Galați", "Ploiești", "Oradea",
  "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
];

function StatusBanner({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const invalidate = useInvalidateAuth();
  const qc = useQueryClient();
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    try {
      await apiFetch("/business/pay", { method: "POST" });
      await invalidate();
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Abonament activat! Anunțul tău este acum vizibil.");
    } catch (err: any) {
      toast.error(err.message ?? "Eroare la plată");
    } finally {
      setPaying(false);
    }
  }

  if (user.businessType === "none") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="bg-blue-100 rounded-xl p-2.5 flex-shrink-0">
          <Lock className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900 text-sm">Postarea anunțurilor necesită un cont de firmă</h3>
          <p className="text-xs text-blue-700/80 mt-0.5">
            Înregistrează-ți firma, creează anunțul și activezi imediat cu plata online.
          </p>
        </div>
        <Link to="/business-upgrade"
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
          Înregistrează firma <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (user.businessStatus === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-red-100 rounded-xl p-2.5 flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 text-sm">Cererea de firmă a fost respinsă</h3>
          <p className="text-xs text-red-700/80 mt-0.5">Contactează administratorii sau retrimite cererea cu date corecte.</p>
        </div>
        <Link to="/business-upgrade"
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">
          Retrimite
        </Link>
      </div>
    );
  }

  // pending: submitted but not yet paid
  if (user.businessStatus === "pending") {
    const price = user.businessType === "company" ? "60" : "30";
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="bg-amber-100 rounded-xl p-2.5 flex-shrink-0">
          <CreditCard className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 text-sm">Anunț creat — activează-l acum</h3>
          <p className="text-xs text-amber-700/80 mt-0.5">
            Plătește abonamentul ({price} lei/lună) și anunțul tău devine vizibil imediat.
          </p>
        </div>
        <button
          onClick={handlePay}
          disabled={paying}
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {paying
            ? <><div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />Se procesează...</>
            : <><CreditCard className="h-3.5 w-3.5" />Plătește {price} lei</>
          }
        </button>
      </div>
    );
  }

  if (user.businessStatus === "approved") {
    const now = new Date();
    const paid = user.paidUntil && new Date(user.paidUntil) > now;

    if (!paid) {
      const price = user.businessType === "company" ? "60" : "30";
      const isExpired = !!user.paidUntil;
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-orange-100 rounded-xl p-2.5 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 text-sm">
              {isExpired ? "Abonamentul a expirat" : "Cont aprobat — activează anunțul"}
            </h3>
            <p className="text-xs text-orange-700/80 mt-0.5">
              {isExpired
                ? "Anunțul tău este ascuns. Reînnoiește abonamentul pentru a-l reactiva."
                : "Plătește abonamentul și anunțul devine vizibil imediat."}
            </p>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {paying
              ? <><div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />Se procesează...</>
              : <><CreditCard className="h-3.5 w-3.5" />{isExpired ? "Reînnoiește" : "Activează"} {price} lei</>
            }
          </button>
        </div>
      );
    }

    const paidDate = new Date(user.paidUntil!).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
    // Check if expiring soon (within 7 days)
    const daysLeft = Math.ceil((new Date(user.paidUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const expiringSoon = daysLeft <= 7;
    const price = user.businessType === "company" ? "60" : "30";

    return (
      <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${expiringSoon ? "bg-yellow-50 border-yellow-200" : "bg-emerald-50 border-emerald-200"}`}>
        <div className={`rounded-xl p-2.5 flex-shrink-0 ${expiringSoon ? "bg-yellow-100" : "bg-emerald-100"}`}>
          <CheckCircle className={`h-5 w-5 ${expiringSoon ? "text-yellow-600" : "text-emerald-600"}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${expiringSoon ? "text-yellow-900" : "text-emerald-900"}`}>
            Firmă activă
            {user.businessType === "company" && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Înregistrată
              </span>
            )}
          </h3>
          <p className={`text-xs mt-0.5 ${expiringSoon ? "text-yellow-700/80" : "text-emerald-700/80"}`}>
            {expiringSoon
              ? `Expiră în ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"} (${paidDate}). Reînnoiește acum pentru continuitate.`
              : `Abonament activ până pe ${paidDate}. Anunțul tău este vizibil.`}
          </p>
        </div>
        {expiringSoon && (
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-yellow-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {paying
              ? <><div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />...</>
              : <><CreditCard className="h-3.5 w-3.5" />Reînnoiește {price} lei</>
            }
          </button>
        )}
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: "",
    phone: user?.phone || "", city: user?.city || "", categoryId: "",
  });
  const [formImages, setFormImages] = useState<string[]>([]);

  const hasBusiness = user?.businessType !== "none";
  const isActive = user?.businessStatus === "approved"
    && !!user?.paidUntil
    && new Date(user.paidUntil) > new Date();

  // Load listings for all business users (even pending/not-paid)
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["myListings"],
    queryFn: () => apiFetch("/listings/mine"),
    enabled: hasBusiness,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });

  const listing: Listing | undefined = (listingsData?.listings ?? [])[0];
  const categories: Category[] = categoriesData?.categories ?? [];

  async function uploadPhoto(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Eroare la upload");
    }
    return (await res.json()).url as string;
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (formImages.length + files.length > 5) {
      toast.error("Poți adăuga maxim 5 poze");
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadPhoto));
      setFormImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setFormImages(prev => prev.filter(u => u !== url));
  }

  function startEdit(l: Listing) {
    setForm({
      title: l.title,
      description: l.description || "",
      price: l.price || "",
      phone: l.phone,
      city: l.city,
      categoryId: l.categoryId ? String(l.categoryId) : "",
    });
    setFormImages(l.images ?? []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setShowForm(false);
    setForm({ title: "", description: "", price: "", phone: user?.phone || "", city: user?.city || "", categoryId: "" });
    setFormImages([]);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!listing) return;
      const body = {
        ...form,
        price: form.price || undefined,
        categoryId: form.categoryId || undefined,
        images: formImages,
      };
      return apiFetch(`/listings/${listing.id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Anunț actualizat!");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/listings/${id}/toggle`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myListings"] }),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/listings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Anunț șters");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Bun venit, <strong>{user?.name}</strong>!</p>
        </div>
        <Link to="/settings"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <Settings className="h-4 w-4" />Setări
        </Link>
      </div>

      {/* Status Banner */}
      {user && <div className="mb-6"><StatusBanner user={user} /></div>}

      {/* Simple user — quick links */}
      {user?.businessType === "none" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link to="/" className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="bg-primary/10 rounded-xl p-2.5 w-fit mb-3">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors">Explorează servicii</h3>
            <p className="text-xs text-muted-foreground mt-1">Găsește servicii din orașul tău</p>
          </Link>
          <Link to="/business-upgrade" className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="bg-amber-50 rounded-xl p-2.5 w-fit mb-3">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors">Înregistrează-ți firma</h3>
            <p className="text-xs text-muted-foreground mt-1">Creează anunțul și plătești după aprobare</p>
          </Link>
        </div>
      )}

      {/* Business section */}
      {hasBusiness && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Anunțul firmei mele</h2>
          </div>

          {/* Edit form */}
          {showForm && listing && (
            <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg">Editează anunțul</h2>
                <button onClick={resetForm} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Titlu *</label>
                  <input required value={form.title} onChange={set("title")}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="ex: Frizerie bărbați, Reparații rapide" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Descriere</label>
                  <textarea value={form.description} onChange={set("description")} rows={3}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Descrie serviciul sau produsul tău..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Preț (lei)</label>
                    <input type="number" min={0} step="0.01" value={form.price} onChange={set("price")}
                      className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="ex: 30" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Categorie</label>
                    <select value={form.categoryId} onChange={set("categoryId")}
                      className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white">
                      <option value="">Fără categorie</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Telefon *</label>
                    <input required value={form.phone} onChange={set("phone")}
                      className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="07xx xxx xxx" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Oraș *</label>
                    <select value={form.city} onChange={set("city")}
                      className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white">
                      <option value="">Selectează</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Photo management */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Poze ({formImages.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formImages.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {formImages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-accent/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {uploading
                          ? <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          : <><ImagePlus className="h-5 w-5" /><span className="text-xs">Adaugă</span></>
                        }
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saveMutation.isPending}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
                    {saveMutation.isPending ? "Se salvează..." : "Actualizează anunțul"}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border-2 border-border hover:bg-secondary transition-colors">
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-border p-5 h-32 animate-pulse" />
          ) : !listing ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
              <div className="bg-secondary rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Niciun anunț creat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {user?.businessStatus === "pending"
                  ? "Cererea ta este în verificare. Dacă dorești să modifici anunțul, retrimite cererea."
                  : "Nu ai creat încă anunțul firmei tale."}
              </p>
              <Link
                to="/business-upgrade"
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {user?.businessStatus === "rejected" ? "Retrimite cererea" : "Creează anunțul"}
              </Link>
            </div>
          ) : (
            <div className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${listing.isActive && isActive ? "border-border" : "border-border/50"}`}>
              {/* Cover photo */}
              {listing.images?.length > 0 && (
                <div className="relative">
                  <img src={listing.images[0]} alt="" className="w-full h-36 object-cover" />
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                      +{listing.images.length - 1} poze
                    </div>
                  )}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      {/* Status badge */}
                      {!isActive && user?.businessStatus === "pending" && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />În verificare
                        </span>
                      )}
                      {!isActive && user?.businessStatus === "approved" && (
                        <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          Neactivat
                        </span>
                      )}
                      {isActive && listing.isActive && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Activ</span>
                      )}
                      {isActive && !listing.isActive && (
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium flex-shrink-0">Inactiv</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.city}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{listing.phone}</span>
                      {listing.price && <span className="font-semibold text-foreground">{listing.price} lei</span>}
                    </div>
                    {listing.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/listing/${listing.id}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
                      <Eye className="h-4 w-4" />
                    </Link>
                    {isActive && (
                      <button onClick={() => toggleMutation.mutate(listing.id)} disabled={toggleMutation.isPending}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        {listing.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                    )}
                    <button onClick={() => startEdit(listing)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm("Ștergi anunțul firmei?")) deleteMutation.mutate(listing.id); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Photo strip */}
                {listing.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-4">
                    {listing.images.slice(1, 5).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full h-14 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
