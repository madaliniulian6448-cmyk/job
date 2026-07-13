import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-primary rounded-lg p-1.5">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-base tracking-tight">Servicii</span>
              <span className="font-bold text-primary text-base tracking-tight">Locale</span>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/despre" className="hover:text-primary transition-colors">Despre</Link>
            <Link to="/termeni" className="hover:text-primary transition-colors">Termeni și condiții</Link>
            <Link to="/confidentialitate" className="hover:text-primary transition-colors">Confidențialitate</Link>
            <a href="mailto:contact@serviciilocale.ro" className="hover:text-primary transition-colors">Contact</a>
          </nav>
        </div>

        <div className="border-t border-border/60 mt-8 pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>© {year} ServiciiLocale. Toate drepturile rezervate.</span>
          <span>Platforma #1 pentru servicii locale în România</span>
        </div>
      </div>
    </footer>
  );
}
