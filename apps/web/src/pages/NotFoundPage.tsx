import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-primary/15 leading-none mb-4 select-none">
          404
        </div>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Search className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Pagina nu a fost găsită</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Pagina pe care o cauți nu există sau a fost mutată. Verifică adresa URL sau întoarce-te acasă.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" /> Acasă
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Înapoi
          </button>
        </div>
      </div>
    </div>
  );
}
