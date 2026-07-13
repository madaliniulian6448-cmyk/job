import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <Helmet>
        <title>Politică de confidențialitate — ServiciiLocale</title>
        <meta
          name="description"
          content="Cum colectăm, folosim și protejăm datele tale personale pe ServiciiLocale."
        />
      </Helmet>

      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/10 rounded-xl p-2.5">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Politică de confidențialitate</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Ultima actualizare: 13 iulie 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        <section>
          <h2>1. Ce date colectăm</h2>
          <ul>
            <li>Date de cont: nume, email, telefon, oraș.</li>
            <li>Date despre anunțuri: titlu, descriere, preț, poze, categorie.</li>
            <li>Date de utilizare: pagini vizitate, click-uri de contact, preferințe (favorite).</li>
            <li>Date tehnice: cookie-uri, adresă IP, tip de browser (vezi secțiunea despre cookie-uri).</li>
          </ul>
        </section>

        <section>
          <h2>2. Cum folosim datele</h2>
          <ul>
            <li>Pentru a-ți crea și administra contul.</li>
            <li>Pentru a afișa și promova anunțurile de firmă.</li>
            <li>Pentru a procesa plățile abonamentelor.</li>
            <li>Pentru a-ți trimite notificări legate de activitatea contului.</li>
            <li>Pentru a îmbunătăți funcționalitatea și securitatea Platformei.</li>
          </ul>
        </section>

        <section>
          <h2>3. Partajarea datelor</h2>
          <p>
            Nu vindem datele tale personale către terți. Datele de contact (telefon) ale unui anunț
            de firmă sunt vizibile public, fiind necesare pentru scopul Platformei — conectarea cu
            clienții. Datele pot fi partajate cu procesatori de plăți sau furnizori tehnici, strict
            în scopul furnizării serviciului.
          </p>
        </section>

        <section>
          <h2>4. Cookie-uri</h2>
          <p>
            Folosim cookie-uri esențiale pentru autentificare și funcționarea Platformei, precum și
            cookie-uri opționale pentru analiză și îmbunătățirea experienței. Poți gestiona
            preferințele privind cookie-urile din bannerul de consimțământ afișat la prima vizită.
          </p>
        </section>

        <section>
          <h2>5. Securitatea datelor</h2>
          <p>
            Aplicăm măsuri tehnice și organizatorice pentru protejarea datelor tale, inclusiv
            criptarea parolelor și restricționarea accesului la informațiile sensibile.
          </p>
        </section>

        <section>
          <h2>6. Drepturile tale</h2>
          <p>Conform GDPR, ai dreptul de a:</p>
          <ul>
            <li>Accesa datele personale pe care le deținem despre tine.</li>
            <li>Solicita corectarea datelor incorecte.</li>
            <li>Solicita ștergerea contului și a datelor asociate.</li>
            <li>Retrage consimțământul pentru procesarea datelor, dacă e cazul.</li>
          </ul>
          <p>
            Pentru exercitarea acestor drepturi, contactează-ne la{" "}
            <a href="mailto:contact@serviciilocale.ro" className="text-primary hover:underline">
              contact@serviciilocale.ro
            </a>
            .
          </p>
        </section>

        <section>
          <h2>7. Păstrarea datelor</h2>
          <p>
            Păstrăm datele contului cât timp acesta este activ. La ștergerea contului, datele
            personale sunt eliminate, cu excepția celor pe care legea ne obligă să le păstrăm
            (de exemplu, evidențe de plată).
          </p>
        </section>

        <section>
          <h2>8. Modificări ale politicii</h2>
          <p>
            Putem actualiza această politică periodic. Vom afișa data ultimei actualizări în partea
            de sus a acestei pagini.
          </p>
        </section>
      </div>
    </div>
  );
}
