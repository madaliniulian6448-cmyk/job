import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, MapPin,
  Building2, Star, AlertCircle, CheckCircle, Clock, X,
  Phone, Tag, TrendingUp, Eye, EyeOff, ArrowRight, Lock, Settings
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface Listing {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  phone: string;
  city: string;
  isActive: boolean;
  categoryId: number | null;
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
  if (user.businessType === "none") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="bg-blue-100 rounded-xl p-2.5 flex-shrink-0">
          <Lock className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900 text-sm">Postarea anunțurilor necesită un cont de firmă</h3>
          <p className="text-xs text-blue-700/80 mt-0.5">
            Contul simplu permite căutare și recenzii. Fă upgrade pentru a posta servicii.
          </p>
        </div>
        <Link to="/business-upgrade"
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
          Upgrade la firmă <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (user.businessStatus === "pending") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-amber-100 rounded-xl p-2.5 flex-shrink-0">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 text-sm">Cererea de firmă este în verificare</h3>
          <p className="text-xs text-amber-700/80 mt-0.5">
            Administratorii verifică datele tale. Vei putea posta anunțuri după aprobare.
          </p>
        </div>
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

  if (user.businessStatus === "approved") {
    const paid = user.paidUntil && new Date(user.paidUntil) > new Date();
    if (!paid) {
      const neverHadSub = !user.paidUntil;
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="bg-orange-100 rounded-xl p-2.5 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 text-sm">
              {neverHadSub ? "Cont aprobat — abonament neactivat" : "Abonamentul a expirat"}
            </h3>
            <p className="text-xs text-orange-700/80 mt-0.5">
              {neverHadSub
                ? "Contul tău de firmă a fost aprobat. Contactează administratorul pentru activarea abonamentului."
                : "Anunțurile tale sunt ascunse. Contactează administratorul pentru reînnoire."}
            </p>
          </div>
        </div>
      );
    }
    const paidDate = new Date(user.paidUntil!).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-emerald-100 rounded-xl p-2.5 flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
            Firmă activă
            {user.businessType === "company" && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Înregistrată
              </span>
            )}
          </h3>
          <p className="text-xs text-emerald-700/80 mt-0.5">
            Abonament activ până pe <strong>{paidDate}</strong>. Anunțurile sunt vizibile.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", price: "",
    phone: user?.phone || "", city: user?.city || "", categoryId: ""
  });

  const canPost = user?.businessType !== "none"
    && user?.businessStatus === "approved"
    && !!user?.paidUntil
    && new Date(user.paidUntil) > new Date();

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["myListings"],
    queryFn: () => apiFetch("/listings/mine"),
    enabled: canPost,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });

  const listings: Listing[] = listingsData?.listings ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { ...form, price: form.price || undefined, categoryId: form.categoryId || undefined };
      if (editId) return apiFetch(`/listings/${editId}`, { method: "PUT", body: JSON.stringify(body) });
      return apiFetch("/listings", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myListings"] });
      toast.success(editId ? "Anunț actualizat!" : "Anunț publicat!");
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myListings"] }); toast.success("Anunț șters"); },
    onError: (err: any) => toast.error(err.message),
  });

  function startEdit(listing: Listing) {
    setEditId(listing.id);
    setForm({
      title: listing.title, description: listing.description || "",
      price: listing.price || "", phone: listing.phone,
      city: listing.city, categoryId: listing.categoryId ? String(listing.categoryId) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setShowForm(false); setEditId(null);
    setForm({ title: "", description: "", price: "", phone: user?.phone || "", city: user?.city || "", categoryId: "" });
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const activeCount = listings.filter(l => l.isActive).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Bun venit, <strong>{user?.name}</strong>!</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground">
            <Settings className="h-4 w-4" />Setări
          </Link>
          {canPost && (
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
              <Plus className="h-4 w-4" />Anunț nou
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {user && <div className="mb-6"><StatusBanner user={user} /></div>}

      {/* Stats — only for businesses */}
      {canPost && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total anunțuri", value: listings.length, icon: <Tag className="h-5 w-5 text-primary" />, bg: "bg-accent" },
            { label: "Active", value: activeCount, icon: <Eye className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
            { label: "Inactive", value: listings.length - activeCount, icon: <EyeOff className="h-5 w-5 text-muted-foreground" />, bg: "bg-secondary" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-border p-4 shadow-card">
              <div className={`${stat.bg} rounded-xl p-2 w-fit mb-3`}>{stat.icon}</div>
              <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Simple user — quick links */}
      {user?.businessType === "none" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link to="/" className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="bg-primary/10 rounded-xl p-2.5 w-fit mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors">Explorează servicii</h3>
            <p className="text-xs text-muted-foreground mt-1">Găsește servicii din orașul tău</p>
          </Link>
          <Link to="/business-upgrade" className="bg-white rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="bg-amber-50 rounded-xl p-2.5 w-fit mb-3">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors">Devino firmă</h3>
            <p className="text-xs text-muted-foreground mt-1">Postează servicii și ajunge la clienți</p>
          </Link>
        </div>
      )}

      {/* Form */}
      {showForm && canPost && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">{editId ? "Editează anunțul" : "Anunț nou"}</h2>
            <button onClick={resetForm} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Titlu *</label>
              <input required value={form.title} onChange={set("title")}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="ex: Mâncare gătită acasă, livrare gratuită" />
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
                  placeholder="ex: 25" />
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
                <Select value={form.city || "__none"} onValueChange={v => setForm(f => ({ ...f, city: v === "__none" ? "" : v }))}>
                  <SelectTrigger className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:ring-0 focus:border-primary transition-colors bg-white h-auto">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Selectează</SelectItem>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saveMutation.isPending}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
                {saveMutation.isPending ? "Se salvează..." : editId ? "Actualizează" : "Publică anunțul"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border-2 border-border hover:bg-secondary transition-colors">
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listings — only for businesses */}
      {canPost && (
        <div>
          <h2 className="text-lg font-bold mb-4">Anunțurile mele</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border p-5 h-20 animate-pulse" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
              <div className="bg-secondary rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">Niciun anunț încă</h3>
              <p className="text-sm text-muted-foreground mb-4">Postează primul tău anunț și ajunge la clienți locali</p>
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />Adaugă primul anunț
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(listing => (
                <div key={listing.id}
                  className={`bg-white rounded-2xl border shadow-card p-5 flex items-start gap-4 transition-all ${listing.isActive ? "border-border" : "border-border/50 opacity-60"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                      {listing.isActive
                        ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Activ</span>
                        : <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium flex-shrink-0">Inactiv</span>
                      }
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.city}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{listing.phone}</span>
                      {listing.price && <span className="font-semibold text-foreground">{listing.price} lei</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/listing/${listing.id}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors text-xs">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button onClick={() => toggleMutation.mutate(listing.id)} disabled={toggleMutation.isPending}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      {listing.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => startEdit(listing)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm("Ștergi anunțul?")) deleteMutation.mutate(listing.id); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
