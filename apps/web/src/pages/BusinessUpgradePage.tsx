import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth, useInvalidateAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  Building2, Briefcase, CheckCircle, Star, ArrowRight, ArrowLeft,
  Info, ImagePlus, X, MapPin, Phone, Tag, Eye
} from "lucide-react";

type BusinessType = "private" | "company";
type Step = 1 | 2 | 3 | 4 | 5;

const CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța",
  "Craiova", "Brașov", "Galați", "Ploiești", "Oradea",
  "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
];

export default function BusinessUpgradePage() {
  const { user } = useAuth();
  const invalidate = useInvalidateAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [type, setType] = useState<BusinessType>("private");

  // Step 2 — business details
  const [biz, setBiz] = useState({
    businessName: "",
    businessDescription: "",
    caen: "",
    cui: "",
    proofUrl: "",
  });

  // Step 3 — listing details + photos
  const [lst, setLst] = useState({
    title: "",
    description: "",
    price: "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    categoryId: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });
  const categories: { id: number; name: string }[] = categoriesData?.categories ?? [];

  const setBizField = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setBiz(f => ({ ...f, [k]: e.target.value }));

  const setLstField = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setLst(f => ({ ...f, [k]: e.target.value }));

  async function uploadPhoto(file: File) {
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
    if (images.length + files.length > 5) {
      toast.error("Poți adăuga maxim 5 poze");
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadPhoto));
      setImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setImages(prev => prev.filter(u => u !== url));
  }

  function validateStep2() {
    if (!biz.businessName.trim()) { toast.error("Introdu numele firmei"); return false; }
    if (type === "company" && (!biz.caen || !biz.cui || !biz.proofUrl)) {
      toast.error("Completează CUI, CAEN și dovada pentru firmă înregistrată");
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!lst.title.trim()) { toast.error("Introdu titlul anunțului"); return false; }
    if (!lst.phone.trim()) { toast.error("Introdu numărul de telefon"); return false; }
    if (!lst.city) { toast.error("Selectează orașul"); return false; }
    return true;
  }

  async function handleRegisterAndPay() {
    setLoading(true);
    try {
      // 1. Save business + listing
      await apiFetch("/business/register", {
        method: "POST",
        body: JSON.stringify({
          businessType: type,
          businessName: biz.businessName,
          businessDescription: biz.businessDescription || undefined,
          caen: biz.caen || undefined,
          cui: biz.cui || undefined,
          proofUrl: biz.proofUrl || undefined,
          listing: {
            title: lst.title,
            description: lst.description || undefined,
            price: lst.price || undefined,
            phone: lst.phone,
            city: lst.city,
            categoryId: lst.categoryId || undefined,
            images,
          },
        }),
      });
      // 2. Activate subscription for 1 month
      await apiFetch("/business/pay", { method: "POST" });
      await invalidate();
      toast.success("Plată confirmată! Anunțul tău este acum activ pentru 1 lună.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = categories.find(c => String(c.id) === lst.categoryId);
  const priceLabel = type === "company" ? "60" : "30";

  const STEPS = ["Tip cont", "Detalii firmă", "Anunțul tău", "Preview", "Plată"];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <button
        onClick={() => (step === 1 ? navigate("/dashboard") : setStep((step - 1) as Step))}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        {step === 1 ? "Înapoi la Dashboard" : "Pasul anterior"}
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground mb-1">Înregistrează-ți firma</h1>
        <p className="text-sm text-muted-foreground">Completează datele firmei și creează-ți anunțul. Plata se face la final.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => {
          const s = (i + 1) as Step;
          const active = step === s;
          const done = step > s;
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground"}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors flex-shrink-0 ${active ? "bg-primary border-primary text-white" : done ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-muted-foreground"}`}>
                  {done ? <CheckCircle className="h-3.5 w-3.5" /> : s}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${done ? "bg-emerald-400" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Tip cont ── */}
      {step === 1 && (
        <div className="space-y-4">
          {[
            {
              value: "private" as BusinessType,
              icon: <Briefcase className="h-5 w-5" />,
              title: "Firmă Privată",
              subtitle: "Fără CUI sau cod CAEN",
              desc: "Perfect pentru persoane care oferă servicii local fără a fi înregistrați fiscal — bucătari, frizeri independenți, meșteri etc.",
              price: "30 lei",
              color: "primary",
            },
            {
              value: "company" as BusinessType,
              icon: <Star className="h-5 w-5" />,
              title: "Firmă Înregistrată",
              subtitle: "CUI + cod CAEN + dovadă",
              desc: "Pentru firme sau PFA-uri înregistrate oficial. Obții cel mai mare grad de credibilitate și vizibilitate pe platformă.",
              price: "60 lei",
              color: "amber",
              badge: "PREMIUM",
            },
          ].map(opt => {
            const sel = type === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${sel ? "border-primary shadow-card" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${sel ? (opt.color === "amber" ? "bg-amber-500" : "bg-primary") : "bg-secondary"}`}>
                      <span className={sel ? "text-white" : "text-muted-foreground"}>{opt.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {opt.title}
                        {opt.badge && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{opt.badge}</span>}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? "border-primary bg-primary" : "border-border"}`}>
                    {sel && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{opt.desc}</p>
                <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                  Cost: <span className="font-bold text-foreground">{opt.price}/lună</span>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setStep(2)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continuă <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Detalii firmă ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Numele firmei / afacerii *</label>
            <input
              value={biz.businessName} onChange={setBizField("businessName")}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="ex: Frizerie Ion, Reparații Mihai"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Descriere scurtă (opțional)</label>
            <textarea
              value={biz.businessDescription} onChange={setBizField("businessDescription")} rows={3}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Ce oferă firma ta, experiență, avantaje..."
            />
          </div>

          {type === "company" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Datele firmei vor fi verificate de administrator. Dovada poate fi un extras RECOM, document scanat sau orice act doveditor.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">CUI *</label>
                  <input value={biz.cui} onChange={setBizField("cui")}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="ex: RO12345678" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cod CAEN *</label>
                  <input value={biz.caen} onChange={setBizField("caen")}
                    className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="ex: 5610" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Link dovadă *</label>
                <input type="url" value={biz.proofUrl} onChange={setBizField("proofUrl")}
                  className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://drive.google.com/..." />
              </div>
            </>
          )}

          <button
            onClick={() => { if (validateStep2()) setStep(3); }}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continuă — Anunțul tău <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── STEP 3: Anunțul + poze ── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Titlu anunț *</label>
            <input
              value={lst.title} onChange={setLstField("title")}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="ex: Frizerie bărbați, Reparații electrocasnice rapide"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Descriere anunț</label>
            <textarea
              value={lst.description} onChange={setLstField("description")} rows={4}
              className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Descrie serviciul, orarul, ce include prețul..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Preț (lei)</label>
              <input
                type="number" min={0} step="0.01"
                value={lst.price} onChange={setLstField("price")}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="ex: 30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Categorie</label>
              <select
                value={lst.categoryId} onChange={setLstField("categoryId")}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="">Fără categorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Telefon *</label>
              <input
                value={lst.phone} onChange={setLstField("phone")}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="07xx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Oraș *</label>
              <select
                value={lst.city} onChange={setLstField("city")}
                className="w-full border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="">Selectează</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Poze ({images.length}/5) <span className="font-normal text-muted-foreground">— opțional</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((url, i) => (
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
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-accent/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Adaugă</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-muted-foreground">Maxim 5 poze, câte 5 MB fiecare. Formate: JPG, PNG, WebP.</p>
          </div>

          <button
            onClick={() => { if (validateStep3()) setStep(4); }}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" /> Preview anunț
          </button>
        </div>
      )}

      {/* ── STEP 4: Preview ── */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Eye className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Așa va arăta anunțul tău după aprobare. Verifică toate detaliile înainte să trimiți.
            </p>
          </div>

          {/* Listing preview card */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            {/* Photos */}
            {images.length > 0 && (
              <div className="relative">
                <img src={images[0]} alt="" className="w-full h-52 object-cover" />
                {images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium">
                    +{images.length - 1} poze
                  </div>
                )}
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full mb-2">
                      <Tag className="h-3 w-3" />{selectedCategory.name}
                    </span>
                  )}
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">{lst.title || "Titlu anunț"}</h2>
                  <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${type === "company" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                    {type === "company" ? <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> : <Briefcase className="h-3 w-3" />}
                    {biz.businessName || "Numele firmei"}
                  </div>
                </div>
                {lst.price && (
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-2xl font-extrabold">{lst.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">lei</span>
                  </div>
                )}
              </div>

              {lst.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-4">{lst.description}</p>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border/60 text-sm text-muted-foreground">
                {lst.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{lst.city}</span>}
                {lst.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{lst.phone}</span>}
              </div>

              {/* Photo grid preview */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-1.5 mt-4">
                  {images.slice(1).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Business info preview */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-bold text-sm mb-3">Profilul firmei</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{(user?.name ?? "U")[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{biz.businessName}</p>
              </div>
            </div>
            {biz.businessDescription && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{biz.businessDescription}</p>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
            <Info className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 leading-relaxed">
              Anunțul va fi <strong>vizibil public</strong> după ce contul de firmă este aprobat și plata de <strong>{type === "company" ? "60" : "30"} lei/lună</strong> este confirmată.
            </p>
          </div>

          <button
            onClick={() => setStep(5)}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continuă la plată <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── STEP 5: Plată ── */}
      {step === 5 && (
        <div className="space-y-5">
          {/* Price summary card */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6">
            <h2 className="font-bold text-lg mb-5">Rezumat comandă</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Abonament {type === "company" ? "Firmă Înregistrată" : "Firmă Privată"}
                </span>
                <span className="font-semibold">{priceLabel} lei</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Perioadă</span>
                <span className="font-semibold">1 lună</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Anunț</span>
                <span className="font-semibold truncate max-w-[180px]">{lst.title}</span>
              </div>
              <div className="border-t border-border/60 pt-3 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-extrabold text-lg text-primary">{priceLabel} lei</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
              Anunțul devine <strong>vizibil public imediat</strong> după plată și rămâne activ <strong>1 lună</strong>. Poți reînnoi oricând din Dashboard.
            </div>
          </div>

          {/* What's included */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-semibold text-sm mb-3">Ce primești</h3>
            <ul className="space-y-2">
              {[
                "Anunț vizibil în motorul de căutare",
                "Poze și descriere completă",
                "Contact direct cu clienții",
                "Badge " + (type === "company" ? "Firmă Înregistrată" : "Firmă Privată"),
                "Reînnoire simplă după expirare",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleRegisterAndPay}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Se procesează...</>
            ) : (
              <><CheckCircle className="h-5 w-5" />Plătește {priceLabel} lei și activează anunțul</>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Anunțul se activează imediat. Poți edita detaliile oricând din Dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
