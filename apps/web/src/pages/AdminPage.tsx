import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import {
  Shield, Users, CheckCircle, XCircle, Clock, Star,
  Building2, Eye, EyeOff, CreditCard, UserCog,
  Search, Filter, ChevronDown, AlertCircle, Plus, Minus
} from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: "user" | "admin";
  businessType: "none" | "private" | "company";
  businessStatus: "pending" | "approved" | "rejected";
  businessName: string | null;
  businessDescription: string | null;
  caen: string | null;
  cui: string | null;
  proofUrl: string | null;
  paidUntil: string | null;
  businessRequestedAt: string | null;
  createdAt: string;
}

type FilterType = "all" | "pending" | "approved" | "rejected" | "companies";

const STATUS_CONFIG = {
  pending: { label: "În așteptare", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Aprobat", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Respins", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/admin/users"),
  });

  const users: User[] = data?.users ?? [];

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 rounded-xl p-2.5">
          <Shield className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Panou Administrator</h1>
          <p className="text-sm text-muted-foreground">Gestionează utilizatorii și firmele platformei</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Utilizatori totali", value: stats.total, icon: <Users className="h-5 w-5 text-primary" />, bg: "bg-accent", onClick: () => setFilter("all") },
          { label: "În așteptare", value: stats.pending, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", onClick: () => setFilter("pending") },
          { label: "Firme active", value: stats.approved, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", onClick: () => setFilter("approved") },
          { label: "Firme înregistrate", value: stats.companies, icon: <Star className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50", onClick: () => setFilter("companies") },
        ].map(stat => (
          <button key={stat.label} onClick={stat.onClick}
            className="bg-white rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all text-left">
            <div className={`${stat.bg} rounded-xl p-2 w-fit mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută după nume, email, oraș..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white"
          />
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

      {/* Users list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-semibold">Niciun utilizator găsit</p>
          <p className="text-sm text-muted-foreground mt-1">Încearcă alte filtre</p>
        </div>
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
                {/* Row */}
                <div
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{user.name[0].toUpperCase()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{user.name}</span>
                      {user.role === "admin" && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                      )}
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
                      {hasBusiness && isPaid && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Plătit până {paidDate}</span>
                      )}
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

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-border p-5 bg-secondary/20 space-y-5">
                    {/* Business info */}
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
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dovadă</span>
                              <a href={user.proofUrl} target="_blank" rel="noopener noreferrer"
                                className="block mt-0.5 text-primary text-xs hover:underline truncate">
                                {user.proofUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* Business status */}
                      {hasBusiness && (
                        <>
                          {user.businessStatus !== "approved" && (
                            <button
                              onClick={() => updateStatus.mutate({ id: user.id, status: "approved" })}
                              disabled={updateStatus.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />Aprobă firmă
                            </button>
                          )}
                          {user.businessStatus !== "rejected" && (
                            <button
                              onClick={() => updateStatus.mutate({ id: user.id, status: "rejected" })}
                              disabled={updateStatus.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />Respinge
                            </button>
                          )}
                          {user.businessStatus !== "pending" && (
                            <button
                              onClick={() => updateStatus.mutate({ id: user.id, status: "pending" })}
                              disabled={updateStatus.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5" />Pune în așteptare
                            </button>
                          )}
                        </>
                      )}

                      {/* Payment */}
                      {user.businessStatus === "approved" && (
                        <>
                          <button
                            onClick={() => extendPayment.mutate({ id: user.id, months: 1 })}
                            disabled={extendPayment.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />+1 lună
                          </button>
                          <button
                            onClick={() => extendPayment.mutate({ id: user.id, months: 3 })}
                            disabled={extendPayment.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />+3 luni
                          </button>
                          {isPaid && (
                            <button
                              onClick={() => { if (confirm("Anulezi abonamentul?")) unmarkPaid.mutate(user.id); }}
                              disabled={unmarkPaid.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />Anulează plata
                            </button>
                          )}
                        </>
                      )}

                      {/* Role toggle */}
                      <button
                        onClick={() => changeRole.mutate({ id: user.id, role: user.role === "admin" ? "user" : "admin" })}
                        disabled={changeRole.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors ml-auto"
                      >
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
    </div>
  );
}
