import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useInvalidateAuth } from "../lib/auth";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
  "Craiova", "Brașov", "Galați", "Ploiești", "Oradea",
  "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
  "Baia Mare", "Buzău", "Botoșani", "Satu Mare", "Râmnicu Vâlcea",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateAuth();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", city: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.city) { toast.error("Selectează un oraș"); return; }
    setLoading(true);
    try {
      await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(form) });
      invalidate();
      toast.success("Cont creat cu succes!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-primary/95 to-blue-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">ServiciiLocale</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
            Alătură-te comunității locale
          </h2>
          <p className="text-blue-200/80 text-lg mb-8 leading-relaxed">
            Creează un cont gratuit și postează servicii, sau găsește ce ai nevoie în câteva secunde.
          </p>
          <div className="space-y-3">
            {[
              "Cont gratuit, fără card",
              "Postare imediată de anunțuri",
              "Upgrade la firmă oricând",
              "Vizibilitate pe tot orașul"
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-blue-100/80 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200/40 text-xs">© 2025 ServiciiLocale. Toate drepturile rezervate.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Creează cont gratuit</h1>
            <p className="text-muted-foreground">Durează mai puțin de 2 minute</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Nume complet *</label>
              <input type="text" required value={form.name} onChange={set("name")}
                className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                placeholder="Ion Popescu" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Adresă email *</label>
              <input type="email" required autoComplete="email" value={form.email} onChange={set("email")}
                className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                placeholder="email@exemplu.ro" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Parolă *</label>
              <div className="relative">
                <input type={show ? "text" : "password"} required minLength={6} value={form.password} onChange={set("password")}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                  placeholder="Minim 6 caractere" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Telefon</label>
                <input type="tel" value={form.phone} onChange={set("phone")}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                  placeholder="07xx xxx xxx" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Oraș *</label>
                <Select value={form.city || "__none"} onValueChange={v => setForm(f => ({ ...f, city: v === "__none" ? "" : v }))}>
                  <SelectTrigger className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:ring-0 focus:border-primary transition-colors bg-white h-auto">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Selectează</SelectItem>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Se creează contul...</>
              ) : (
                <>Creează cont gratuit <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Prin înregistrare, accepți <span className="text-primary cursor-pointer hover:underline">Termenii și condițiile</span>.
          </p>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Ai deja cont?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Conectează-te</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
