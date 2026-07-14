import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Shield, Users, CheckCircle, XCircle, Clock, Star,
  Building2, CreditCard, UserCog, Search, ChevronDown,
  AlertCircle, Plus, Minus, BadgeCheck, Flag, Zap,
  ZapOff, ExternalLink,
} from "lucide-react";
import { EmptyState } from "../components/ui/empty-state";
import { EmptySearchIllustration, GenericEmptyIllustration, EmptyListingsIllustration } from "../components/ui/illustrations";
import { Badge } from "../components/ui/badge";

interface User {
  id: number; name: string; email: string; phone: string | null;
  city: string | null; role: "user" | "admin";
  businessType: "none" | "private" | "company";
  businessStatus: "pending" | "approved" | "rejected";
  businessName: string | null; businessDescription: string | null;
  caen: string | null; cui: string | null; proofUrl: string | null;
  paidUntil: string | null; businessRequestedAt: string | null;
  createdAt: string; isVerified: boolean;
}

interface AdminListing {
  id: number; title: string; city: string; isPromoted: boolean;
  promotedUntil: string | null; createdAt: string; isActive: boolean;
  owner: { id: number; name: string; businessName: string | null };
  category: { id: number; name: string } | null;
}

interface AdminReport {
  id: number; reason: string; status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  listing: { id: number; title: string };
  reporter: { id: number; name: string };
}

type FilterType = "all" | "pending" | "approved" | "rejected" | "companies";
type Tab = "users" | "reports" | "promotions";

const STATUS_CONFIG = {
  pending: { label: "În așteptare", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Aprobat", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Respins", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("pending");

  // ── Users ──────────────────────────────────────────────────────────────
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/admin/users"),
  });
  const users: User[] = usersData?.users ?? [];

  // ── Listings ───────────────────────────────────────────────────────────
  const { data: listingsData, isLoading: loadingListings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => apiFetch("/admin/listings"),
    enabled: activeTab === "promotions",
  });
  const adminListings: AdminListing[] = listingsData?.listings ?? [];

  // ── Reports ────────────────────────────────────────────────────────────
  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => apiFetch("/admin/reports"),
    enabled: activeTab === "reports",
  });
  const allReports: AdminReport[] = reportsData?.reports ?? [];
  const visibleReports = reportFilter === "all"
    ? allReports
    : allReports.filter(r => r.status === reportFilter);

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/admin/users/${id}/business-status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Status actualizat"); },
    onError: (err: any) => toast.error(err.message),
  });

  const extendPayment = useMutation({
    mutationFn: ({ id, months }: { id: number; months: number }) =>
      apiFetch(`/admin/users/${id}/paid-until`, { method: "PATCH", body: JSON.stringify({ months }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Abonament extins"); },
    onError: (err: any) => toast.error(err.message),
  });

  const unmarkPaid = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/users/${id}/unmark-paid`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Abonament anulat"); },
    onError: (err: any) => toast.error(err.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiFetch(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Rol actualizat"); },
    onError: (err: any) => toast.error(err.message),
  });

  const verifyUser = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/users/${id}/verify`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Verificare actualizată"); },
    onError: (err: any) => toast.error(err.message),
  });

  const promoteListing = useMutation({
    mutationFn: ({ id, months }: { id: number; months: number }) =>
      apiFetch(`/admin/listings/${id}/promote`, { method: "PATCH", body: JSON.stringify({ months }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); toast.success("Anunț promovat"); },
    onError: (err: any) => toast.error(err.message),
  });

  const unpromoteListing = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/listings/${id}/unpromote`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); toast.success("Promovare anulată"); },
    onError: (err: any) => toast.error(err.message),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Raport actualizat"); },
    onError: (err: any) => toast.error(err.message),
  });

  // ── Filtered users ─────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchesFilter =
      filter === "all" ? true :
      filter === "pending" ? u.businessStatus === "pending" && u.businessType !== "none" :
      filter === "approved" ? u.businessStatus === "approved" :
      filter === "rejected" ? u.businessStatus === "rejected" :
      filter === "companies" ? u.businessType === "company" : true;
    const matchesSearch = !search || [u.name, u.email, u.businessName, u.city].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    );
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: users.length,
    pending: users.filter(u => u.businessType !== "none" && u.businessStatus === "pending").length,
    approved: users.filter(u => u.businessStatus === "approved").length,
    companies: users.filter(u => u.businessType === "company").length,
  };

  const pendingReportsCount = allReports.filter(r => r.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 rounded-xl p-2.5">
          <Shield className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Panou Administrator</h1>
          <p className="text-sm text-muted-foreground">Gestionează utilizatorii și conținutul platformei</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit mb-8">
        {([
          { id: "users" as Tab, label: "Utilizatori", icon: <Users className="h-4 w-4" /> },
          { id: "reports" as Tab, label: `Rapoarte${pendingReportsCount > 0 ? ` (${pendingReportsCount})` : ""}`, icon: <Flag className="h-4 w-4" /> },
          { id: "promotions" as Tab, label: "Promoții", icon: <Zap className="h-4 w-4" /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Utilizatori totali", value: stats.total, icon: <Users className="h-5 w-5 text-primary" />, bg: "bg-accent", f: "all" as FilterType },
              { label: "În așteptare", value: stats.pending, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", f: "pending" as FilterType },
              { label: "Firme active", value: stats.approved, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", f: "approved" as FilterType },
              { label: "Firme înregistrate", value: stats.companies, icon: <Star className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50", f: "companies" as FilterType },
            ].map(s => (
              <button key={s.label} onClick={() => setFilter(s.f)}
                className="bg-white rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all text-left">
                <div className={`${s.bg} rounded-xl p-2 w-fit mb-3`}>{s.icon}</div>
                <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Caută după nume, email, oraș..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {(["all", "pending", "approved", "rejected", "companies"] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:bg-secondary"}`}>
                  {f === "all" ? "Toți" : f === "pending" ? "În așteptare" : f === "approved" ? "Aprobați" : f === "rejected" ? "Respinși" : "Firme"}
                </button>
              ))}
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border h-20 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState illustration={EmptySearchIllustration} title="Niciun utilizator găsit" />
          ) : (
            <div className="space-y-3">
              {filtered.map(user => {
                const isExpanded = expandedId === user.id;
                const hasBusiness = user.businessType !== "none";
                const isPaid = user.paidUntil && new Date(user.paidUntil) > new Date();
                const statusCfg = STATUS_CONFIG[user.businessStatus];
                const paidDate = user.paidUntil ? new Date(user.paidUntil).toLocaleDateString("ro-RO") : null;
                return (
                  <div key={user.id} className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                    <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : user.id)}>
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{user.name[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{user.name}</span>
                          {user.role === "admin" && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>}
                          {hasBusiness && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${statusCfg.color}`}>
                              {statusCfg.icon}{statusCfg.label}
                            </span>
                          )}
                          {user.businessType === "company" && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />Firmă
                            </span>
                          )}
                          {user.isVerified && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                              <BadgeCheck className="h-3 w-3" />Verificat
                            </span>
                          )}
                          {hasBusiness && isPaid && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Plătit până {paidDate}</span>}
                          {hasBusiness && !isPaid && user.businessStatus === "approved" && (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              <AlertCircle className="h-3 w-3" />Expirat
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{user.email}</span>
                          {user.city && <span>• {user.city}</span>}
                          {user.businessName && <span>• {user.businessName}</span>}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border p-5 bg-secondary/20 space-y-5">
                        {hasBusiness && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tip firmă</span><p className="font-medium mt-0.5">{user.businessType === "private" ? "Firmă privată" : "Firmă înregistrată"}</p></div>
                              {user.businessName && <div><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nume firmă</span><p className="font-medium mt-0.5">{user.businessName}</p></div>}
                              {user.businessDescription && <div><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descriere</span><p className="text-muted-foreground mt-0.5 text-xs">{user.businessDescription}</p></div>}
                            </div>
                            <div className="space-y-2">
                              {user.cui && <div><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CUI</span><p className="font-medium mt-0.5 font-mono">{user.cui}</p></div>}
                              {user.caen && <div><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cod CAEN</span><p className="font-medium mt-0.5 font-mono">{user.caen}</p></div>}
                              {user.proofUrl && (
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dovadă firmă</span>
                                  <a href={user.proofUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 mt-0.5 text-primary text-xs hover:underline truncate">
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />Vizualizează documentul
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {hasBusiness && (
                            <>
                              {user.businessStatus !== "approved" && (
                                <button onClick={() => updateStatus.mutate({ id: user.id, status: "approved" })} disabled={updateStatus.isPending}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                  <CheckCircle className="h-3.5 w-3.5" />Aprobă firmă
                                </button>
                              )}
                              {user.businessStatus !== "rejected" && (
                                <button onClick={() => updateStatus.mutate({ id: user.id, status: "rejected" })} disabled={updateStatus.isPending}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                                  <XCircle className="h-3.5 w-3.5" />Respinge
                                </button>
                              )}
                              {user.businessStatus !== "pending" && (
                                <button onClick={() => updateStatus.mutate({ id: user.id, status: "pending" })} disabled={updateStatus.isPending}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                                  <Clock className="h-3.5 w-3.5" />Pune în așteptare
                                </button>
                              )}
                              <button onClick={() => verifyUser.mutate(user.id)} disabled={verifyUser.isPending}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${user.isVerified ? "border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "bg-emerald-600 text-white hover:bg-emerald-700"} disabled:opacity-50`}>
                                <BadgeCheck className="h-3.5 w-3.5" />
                                {user.isVerified ? "Revocat verificare" : "Verifică firma"}
                              </button>
                            </>
                          )}

                          {user.businessStatus === "approved" && (
                            <>
                              <button onClick={() => extendPayment.mutate({ id: user.id, months: 1 })} disabled={extendPayment.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                                <Plus className="h-3.5 w-3.5" />+1 lună
                              </button>
                              <button onClick={() => extendPayment.mutate({ id: user.id, months: 3 })} disabled={extendPayment.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                                <Plus className="h-3.5 w-3.5" />+3 luni
                              </button>
                              {isPaid && (
                                <button onClick={() => { if (confirm("Anulezi abonamentul?")) unmarkPaid.mutate(user.id); }} disabled={unmarkPaid.isPending}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                                  <Minus className="h-3.5 w-3.5" />Anulează plata
                                </button>
                              )}
                            </>
                          )}

                          <button onClick={() => changeRole.mutate({ id: user.id, role: user.role === "admin" ? "user" : "admin" })} disabled={changeRole.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors ml-auto">
                            <UserCog className="h-3.5 w-3.5" />
                            {user.role === "admin" ? "Setează utilizator" : "Setează admin"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {(["pending", "all", "resolved", "dismissed"] as const).map(f => (
              <button key={f} onClick={() => setReportFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${reportFilter === f ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:bg-secondary"}`}>
                {f === "pending" ? `În așteptare (${allReports.filter(r => r.status === "pending").length})` : f === "all" ? "Toate" : f === "resolved" ? "Rezolvate" : "Respinse"}
              </button>
            ))}
          </div>

          {loadingReports ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border h-24 animate-pulse" />)}</div>
          ) : visibleReports.length === 0 ? (
            <EmptyState illustration={GenericEmptyIllustration} title={`Niciun raport ${reportFilter === "pending" ? "în așteptare" : ""}`} />
          ) : (
            <div className="space-y-3">
              {visibleReports.map(r => {
                const date = new Date(r.createdAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-border shadow-card p-5">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-xl p-2 flex-shrink-0 mt-0.5 ${r.status === "pending" ? "bg-red-50" : r.status === "resolved" ? "bg-emerald-50" : "bg-secondary"}`}>
                        <Flag className={`h-4 w-4 ${r.status === "pending" ? "text-red-600" : r.status === "resolved" ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link to={`/listing/${r.listing.id}`} target="_blank"
                            className="font-semibold text-sm hover:text-primary transition-colors inline-flex items-center gap-1">
                            {r.listing.title}<ExternalLink className="h-3 w-3" />
                          </Link>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "pending" ? "bg-red-50 text-red-700" : r.status === "resolved" ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                            {r.status === "pending" ? "În așteptare" : r.status === "resolved" ? "Rezolvat" : "Respins"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Raportat de <strong>{r.reporter.name}</strong> · {date}
                        </p>
                        <p className="text-sm text-foreground bg-secondary/50 rounded-lg px-3 py-2">{r.reason}</p>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => resolveReport.mutate({ id: r.id, status: "resolved" })} disabled={resolveReport.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
                            <CheckCircle className="h-3.5 w-3.5" />Rezolvă
                          </button>
                          <button onClick={() => resolveReport.mutate({ id: r.id, status: "dismissed" })} disabled={resolveReport.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-border text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                            <XCircle className="h-3.5 w-3.5" />Respinge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── PROMOTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === "promotions" && (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            Anunțurile promovate apar primele în feed și pe paginile de categorie, cu badge-ul ⚡ Promovat.
          </p>
          {loadingListings ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border h-20 animate-pulse" />)}</div>
          ) : adminListings.length === 0 ? (
            <EmptyState illustration={EmptyListingsIllustration} title="Niciun anunț disponibil" />
          ) : (
            <div className="space-y-3">
              {adminListings.map(l => {
                const now = new Date();
                const isActivePromo = l.isPromoted && l.promotedUntil && new Date(l.promotedUntil) > now;
                const promoDate = l.promotedUntil ? new Date(l.promotedUntil).toLocaleDateString("ro-RO") : null;
                return (
                  <div key={l.id} className={`bg-white rounded-2xl border shadow-card p-5 flex items-center gap-4 ${isActivePromo ? "border-amber-200 bg-amber-50/30" : "border-border"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/listing/${l.id}`} target="_blank"
                          className="font-semibold text-sm hover:text-primary transition-colors inline-flex items-center gap-1">
                          {l.title}<ExternalLink className="h-3 w-3" />
                        </Link>
                        {isActivePromo && (
                          <Badge variant="brand">
                            <Zap className="h-3 w-3" />Promovat până {promoDate}
                          </Badge>
                        )}
                        {!l.isActive && (
                          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Inactiv</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.owner.businessName ?? l.owner.name} · {l.city}
                        {l.category && ` · ${l.category.name}`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isActivePromo ? (
                        <>
                          <button onClick={() => promoteListing.mutate({ id: l.id, months: 1 })} disabled={promoteListing.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
                            <Plus className="h-3.5 w-3.5" />+1 lună
                          </button>
                          <button onClick={() => unpromoteListing.mutate(l.id)} disabled={unpromoteListing.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50">
                            <ZapOff className="h-3.5 w-3.5" />Oprește
                          </button>
                        </>
                      ) : (
                        <button onClick={() => promoteListing.mutate({ id: l.id, months: 1 })} disabled={promoteListing.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
                          <Zap className="h-3.5 w-3.5" />Promovează 1 lună
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
