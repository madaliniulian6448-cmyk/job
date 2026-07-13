import { Helmet } from "react-helmet-async";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <Helmet>
        <title>Termeni și condiții — ServiciiLocale</title>
        <meta
          name="description"
          content="Termenii și condițiile de utilizare a platformei ServiciiLocale."
        />
      </Helmet>

      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/10 rounded-xl p-2.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Termeni și condiții</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Ultima actualizare: 13 iulie 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        <section>
          <h2>1. Acceptarea termenilor</h2>
          <p>
            Prin utilizarea platformei ServiciiLocale ("Platforma"), confirmi că ai citit, înțeles
            și accepți acești Termeni și condiții. Dacă nu ești de acord, te rugăm să nu folosești
            Platforma.
          </p>
        </section>

        <section>
          <h2>2. Descrierea serviciului</h2>
          <p>
            ServiciiLocale este o platformă online care conectează furnizori de servicii locale
            (frizeri, meșteri, transportatori, etc.) cu potențiali clienți din România. Platforma
            oferă un spațiu de listare și căutare, dar nu este parte în relația contractuală dintre
            furnizor și client.
          </p>
        </section>

        <section>
          <h2>3. Conturi de utilizator</h2>
          <ul>
            <li>Ești responsabil pentru confidențialitatea datelor de autentificare ale contului tău.</li>
            <li>Informațiile furnizate la înregistrare trebuie să fie corecte și actuale.</li>
            <li>Ne rezervăm dreptul de a suspenda sau șterge conturile care violează acești termeni.</li>
          </ul>
        </section>

        <section>
          <h2>4. Anunțuri de firmă</h2>
          <ul>
            <li>Anunțurile trebuie să reflecte servicii reale, oferite legal pe teritoriul României.</li>
            <li>Este interzisă publicarea de conținut fals, înșelător sau ilegal.</li>
            <li>Anunțurile pot fi verificate manual înainte de aprobare.</li>
            <li>Activarea unui anunț se face în urma plății abonamentului aplicabil.</li>
          </ul>
        </section>

        <section>
          <h2>5. Plăți și abonamente</h2>
          <p>
            Abonamentele pentru anunțuri de firmă sunt plătite lunar și oferă vizibilitate pe
            Platformă pe durata perioadei active. Neînnoirea abonamentului duce la dezactivarea
            automată a anunțului. Sumele plătite nu sunt rambursabile, cu excepția cazurilor
            prevăzute de legislația în vigoare.
          </p>
        </section>

        <section>
          <h2>6. Limitarea răspunderii</h2>
          <p>
            ServiciiLocale nu garantează calitatea, siguranța sau legalitatea serviciilor oferite de
            furnizorii listați. Orice tranzacție sau interacțiune între utilizatori se realizează pe
            propria răspundere. Platforma nu este responsabilă pentru daune directe sau indirecte
            rezultate din utilizarea serviciilor listate.
          </p>
        </section>

        <section>
          <h2>7. Proprietate intelectuală</h2>
          <p>
            Conținutul Platformei (design, logo, text) este proprietatea ServiciiLocale. Conținutul
            postat de utilizatori (text, imagini) rămâne proprietatea acestora, dar prin publicare
            acordă Platformei o licență neexclusivă de afișare.
          </p>
        </section>

        <section>
          <h2>8. Modificarea termenilor</h2>
          <p>
            Ne rezervăm dreptul de a modifica acești termeni oricând. Modificările vor fi publicate
            pe această pagină, iar continuarea utilizării Platformei reprezintă acceptarea acestora.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Pentru întrebări legate de acești termeni, ne poți contacta la adresa{" "}
            <a href="mailto:contact@serviciilocale.ro" className="text-primary hover:underline">
              contact@serviciilocale.ro
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
