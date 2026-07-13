import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white border border-border rounded-2xl shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="bg-amber-50 rounded-xl p-2.5 flex-shrink-0">
          <Cookie className="h-5 w-5 text-amber-600" />
        </div>
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
          Folosim cookie-uri esențiale pentru funcționarea platformei și cookie-uri opționale pentru
          analiză. Poți afla mai multe în{" "}
          <Link to="/confidentialitate" className="text-primary font-medium hover:underline">
            Politica de confidențialitate
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:bg-secondary transition-colors"
          >
            Refuz
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
