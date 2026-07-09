import { Link } from "react-router-dom";
import { CheckCircle, Users, MapPin, Star, Shield, Zap, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-primary/95 to-blue-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-white/25">
            <Heart className="h-4 w-4 text-pink-300" />
            Construit pentru comunitate
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Despre <span className="text-blue-300">ServiciiLocale</span>
          </h1>
          <p className="text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Platforma care conectează furnizorii de servicii locale cu clienții din același oraș.
            Simplu, rapid și de încredere.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Misiunea noastră</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ServiciiLocale a fost creat pentru a simplifica găsirea serviciilor locale de calitate
              din România. Credem că fiecare comunitate merită acces ușor la furnizori verificați —
              de la frizeri și meșteri, până la transportatori și bucătari la domiciliu.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ajutăm afacerile mici să fie descoperite online și clienților să găsească exact ce
              au nevoie, fără bătăi de cap.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Users className="h-6 w-6" />, val: "500+", label: "Utilizatori activi", color: "bg-blue-50 text-blue-600" },
              { icon: <MapPin className="h-6 w-6" />, val: "20+", label: "Orașe acoperite", color: "bg-emerald-50 text-emerald-600" },
              { icon: <Star className="h-6 w-6" />, val: "200+", label: "Firme listate", color: "bg-amber-50 text-amber-600" },
              { icon: <CheckCircle className="h-6 w-6" />, val: "100%", label: "Firme verificate", color: "bg-purple-50 text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-border p-5 text-center shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                  {s.icon}
                </div>
                <div className="text-2xl font-extrabold text-foreground">{s.val}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Cum funcționează</h2>
          <p className="text-muted-foreground text-center mb-10">Trei pași simpli pentru a găsi serviciul de care ai nevoie</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <MapPin className="h-6 w-6" />,
                title: "Caută în orașul tău",
                desc: "Selectează orașul și categoria de servicii. Găsești imediat furnizorii din zona ta.",
                color: "bg-blue-500",
              },
              {
                step: "02",
                icon: <Star className="h-6 w-6" />,
                title: "Compară și alege",
                desc: "Vezi recenziile, prețurile și profilul fiecărui furnizor. Salvează-i pe cei care îți plac.",
                color: "bg-purple-500",
              },
              {
                step: "03",
                icon: <Zap className="h-6 w-6" />,
                title: "Contactează direct",
                desc: "Suni direct furnizorul ales — fără intermediari, fără comisioane ascunse.",
                color: "bg-emerald-500",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-border">{item.step}</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Valorile noastre</h2>
          <p className="text-muted-foreground text-center mb-10">Ce ne ghidează în tot ce facem</p>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: <Shield className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50", title: "Transparență", desc: "Toate firmele listare sunt verificate manual înainte de a fi aprobate. Nu permitem conținut fals sau înșelător." },
              { icon: <Heart className="h-5 w-5 text-pink-600" />, bg: "bg-pink-50", title: "Comunitate", desc: "Susținem afacerile locale mici și le ajutăm să crească prin vizibilitate digitală accesibilă." },
              { icon: <Zap className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", title: "Simplitate", desc: "Interfață intuitivă, fără complicații. Găsești ce cauți în câteva secunde, indiferent de vârstă sau experiență." },
              { icon: <Users className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", title: "Acces egal", desc: "Platformă accesibilă tuturor — atât clienților care caută, cât și furnizorilor care doresc să fie găsiți." },
            ].map((v) => (
              <div key={v.title} className="flex gap-4 bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center shrink-0`}>
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-blue-700 rounded-3xl text-white p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Gata să începi?</h2>
          <p className="text-blue-100/80 mb-8 max-w-md mx-auto">Creează-ți un cont gratuit și descoperă serviciile locale din orașul tău.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
              Înregistrare gratuită <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20">
              Caută servicii
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
