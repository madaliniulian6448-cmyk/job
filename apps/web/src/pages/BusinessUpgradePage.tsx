import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth, useInvalidateAuth } from "../lib/auth";
import { toast } from "sonner";
import { Building2, Briefcase, CheckCircle, Star, ArrowRight, ArrowLeft, Info } from "lucide-react";

type BusinessType = "private" | "company";

const PRIVATE_BENEFITS = [
  "Badge de firmă privată pe anunțuri",
  "Prioritate în listare față de utilizatori simpli",
  "Profil dedicat cu descriere extinsă",
  "Vizibil în filtrul de firme",
];

const COMPANY_BENEFITS = [
  "Toate beneficiile firmei private",
  "Badge premium cu stea galbenă",
  "Prioritate maximă în listare",
  "Certificat de firmă înregistrată",
  "Suport dedicat din partea echipei",
];

export default function BusinessUpgradePage() {
  const { user } = useAuth();
  const invalidate = useInvalidateAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<BusinessType>("private");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessDescription: "",
    caen: "",
    cui: "",
    proofUrl: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName) { toast.error("Introdu numele firmei"); return; }
    if (type === "company" && (!form.caen || !form.cui || !form.proofUrl)) {
      toast.error("Completează toate câmpurile pentru firmă înregistrată");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/business/request", {
        method: "POST",
        body: JSON.stringify({ businessType: type, ...form }),
      });
      invalidate();
      toast.success("Cererea a fost trimisă! Vei fi notificat după verificare.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <button onClick={() => step === 2 ? setStep(1) : navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        {step === 2 ? "Înapoi la selecție" : "Înapoi la Dashboard"}
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Upgrade la Cont de Firmă</h1>
        <p className="text-muted-foreground">Obține mai multă vizibilitate și credibilitate pentru afacerea ta locală</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map(s => (
          <div key={s} className={`flex items-center gap-2 text-sm font-medium ${step >= s ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step >= s ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>
              {s}
            </div>
            {s === 1 ? "Tip cont" : "Detalii firmă"}
            {s < 2 && <div className={`h-px w-8 ml-1 ${step > s ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Private */}
          <div
            onClick={() => setType("private")}
            className={`bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${type === "private" ? "border-primary shadow-card" : "border-border hover:border-primary/40"}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${type === "private" ? "bg-primary" : "bg-secondary"}`}>
                  <Briefcase className={`h-5 w-5 ${type === "private" ? "text-white" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Firmă Privată</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Fără CUI sau cod CAEN</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${type === "private" ? "border-primary bg-primary" : "border-border"}`}>
                {type === "private" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Perfect pentru persoane care oferă servicii la nivel local fără a fi înregistrați fiscal — bucătari, frizeri independenți, meșteri etc.
            </p>
            <ul className="space-y-2">
              {PRIVATE_BENEFITS.map(b => (
                <li key={b} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground">Abonament lunar: </span>
              <span className="text-sm font-bold text-foreground">~30 lei/lună</span>
            </div>
          </div>

          {/* Company */}
          <div
            onClick={() => setType("company")}
            className={`bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${type === "company" ? "border-primary shadow-card" : "border-border hover:border-primary/40"}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${type === "company" ? "bg-amber-500" : "bg-secondary"}`}>
                  <Star className={`h-5 w-5 ${type === "company" ? "text-white fill-white" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    Firmă Înregistrată
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">PREMIUM</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">CUI + cod CAEN + dovadă</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${type === "company" ? "border-primary bg-primary" : "border-border"}`}>
                {type === "company" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Pentru firme sau PFA-uri înregistrate oficial. Obții cel mai mare grad de credibilitate și vizibilitate pe platformă.
            </p>
            <ul className="space-y-2">
              {COMPANY_BENEFITS.map(b => (
                <li key={b} className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground">Abonament lunar: </span>
              <span className="text-sm font-bold text-foreground">~60 lei/lună</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continuă cu <span className="font-bold">{type === "private" ? "Firmă Privată" : "Firmă Înregistrată"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className={`rounded-xl p-2.5 ${type === "company" ? "bg-amber-500" : "bg-primary"}`}>
              {type === "company" ? <Star className="h-5 w-5 text-white fill-white" /> : <Briefcase className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">{type === "private" ? "Firmă Privată" : "Firmă Înregistrată"}</h3>
              <p className="text-xs text-muted-foreground">Completează detaliile firmei tale</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Numele firmei / afacerii *</label>
            <input required value={form.businessName} onChange={set("businessName")}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="ex: Bucătăria Mariei, Frizerie Ion" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Descriere</label>
            <textarea value={form.businessDescription} onChange={set("businessDescription")} rows={3}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Descrie pe scurt ce oferă firma ta..." />
          </div>

          {type === "company" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Pentru firmele înregistrate, datele vor fi verificate de administrator. Dovada (link) poate fi un document scanat, extras RECOM sau orice act doveditor.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">CUI *</label>
                  <input required value={form.cui} onChange={set("cui")}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="ex: RO12345678" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cod CAEN *</label>
                  <input required value={form.caen} onChange={set("caen")}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="ex: 5610" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Link dovadă înregistrare *</label>
                <input required type="url" value={form.proofUrl} onChange={set("proofUrl")}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://drive.google.com/..." />
                <p className="text-xs text-muted-foreground mt-1.5">Folosește Google Drive, Dropbox sau alt serviciu cloud. Vizibil doar pentru administrator.</p>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Se trimite...</>
            ) : (
              <>Trimite cererea <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
