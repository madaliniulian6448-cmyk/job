import { useState } from "react";
import { useAuth, useInvalidateAuth } from "../lib/auth";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import { Settings, User, Lock, Save, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
  "Craiova", "Brașov", "Galați", "Ploiești", "Oradea",
  "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
  "Baia Mare", "Buzău", "Botoșani", "Satu Mare", "Râmnicu Vâlcea",
];

export default function SettingsPage() {
  const { user } = useAuth();
  const invalidate = useInvalidateAuth();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false });
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch("/profile/me", { method: "PATCH", body: JSON.stringify(profile) });
      invalidate();
      toast.success("Profil actualizat!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("Parolele noi nu coincid");
      return;
    }
    setSavingPw(true);
    try {
      await apiFetch("/profile/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      });
      toast.success("Parola a fost schimbată!");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-secondary rounded-xl p-2.5">
          <Settings className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Setări cont</h1>
          <p className="text-sm text-muted-foreground">Gestionează informațiile contului tău</p>
        </div>
      </div>

      {/* Account type banner */}
      {user.businessType === "none" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-blue-900 text-sm">Cont utilizator simplu</p>
            <p className="text-xs text-blue-700/80 mt-0.5">
              Poți căuta servicii și lăsa recenzii. Fă upgrade la cont de firmă pentru a posta anunțuri.
            </p>
          </div>
          <Link to="/business-upgrade"
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
            Upgrade la firmă <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-secondary rounded-2xl p-4 mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user.businessName || "Firmă"}</p>
            <p className="text-xs text-muted-foreground">
              {user.businessType === "company" ? "Firmă înregistrată" : "Firmă privată"} ·{" "}
              {user.businessStatus === "approved" ? "Aprobat" : user.businessStatus === "pending" ? "În așteptare" : "Respins"}
            </p>
          </div>
          <Link to="/dashboard" className="ml-auto text-xs text-primary hover:underline">
            Dashboard →
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-bold text-base">Informații personale</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Nume complet</label>
              <input
                type="text" required value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Telefon</label>
                <input
                  type="tel" value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="07xx xxx xxx"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Oraș</label>
                <select value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white">
                  <option value="">Selectează</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email</label>
              <input
                type="email" value={user.email} disabled
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm bg-secondary/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Emailul nu poate fi schimbat</p>
            </div>
            <button type="submit" disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
              <Save className="h-4 w-4" />
              {savingProfile ? "Se salvează..." : "Salvează modificările"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-bold text-base">Schimbă parola</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Parola curentă</label>
              <div className="relative">
                <input
                  type={showPw.current ? "text" : "password"} required
                  value={passwords.currentPassword}
                  onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Parola actuală"
                />
                <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Parola nouă</label>
                <div className="relative">
                  <input
                    type={showPw.new ? "text" : "password"} required minLength={6}
                    value={passwords.newPassword}
                    onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Minim 6 caractere"
                  />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Confirmă parola</label>
                <input
                  type="password" required minLength={6}
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Repetă parola nouă"
                />
              </div>
            </div>
            <button type="submit" disabled={savingPw}
              className="inline-flex items-center gap-2 bg-foreground text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 shadow-sm">
              <Lock className="h-4 w-4" />
              {savingPw ? "Se schimbă..." : "Schimbă parola"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
