import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useInvalidateAuth } from "../lib/auth";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateAuth();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      invalidate();
      toast.success("Conectat cu succes!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-primary/95 to-blue-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">ServiciiLocale</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
            Conectează-te la comunitatea ta locală
          </h2>
          <p className="text-blue-200/80 text-lg leading-relaxed mb-8">
            Mii de servicii locale te așteaptă. Găsește, contactează și colaborează cu oameni din orașul tău.
          </p>
          <div className="space-y-3">
            {["Anunțuri verificate din zona ta", "Firme locale de încredere", "Contact direct, fără intermediari"].map(item => (
              <div key={item} className="flex items-center gap-3 text-blue-100/80 text-sm">
                <div className="h-5 w-5 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="h-3 w-3 text-emerald-400" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200/40 text-xs">© 2025 ServiciiLocale. Toate drepturile rezervate.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Bun venit înapoi</h1>
            <p className="text-muted-foreground">Conectează-te la contul tău</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Adresă email</label>
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                placeholder="email@exemplu.ro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Parolă</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} required autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Se conectează...</>
              ) : (
                <>Conectare <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Nu ai cont?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Înregistrează-te gratuit
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
