import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Adapt2Life",
  description: "Informations légales officielles de la plateforme Adapt2Life.",
};

const sections = [
  {
    title: "Éditeur du site",
    content: [
      "Raison sociale : Adapt2Life Inc.",
      "Forme juridique : Corporation",
      "Siège social : 115 rue Jean Lefèvre, La Malbaie, QC, G5A 1V3, Canada",
      "Adresse e-mail : contact@adapt2life.app",
    ],
  },
  {
    title: "Directeur de la publication",
    content: ["Benjamin Dour"],
  },
  {
    title: "Hébergement",
    content: [
      "Hébergeur : Vercel Inc.",
      "Adresse : 440 N Barranca Ave #4133, Covina, CA, 91723, États-Unis",
    ],
  },
  {
    title: "Propriété intellectuelle",
    content: [
      "L’ensemble du contenu présent sur ce site (graphiques, images, textes, vidéos, animations, sons, logos, icônes et leur mise en forme) est la propriété exclusive d’Adapt2Life Inc., sauf mention contraire appartenant à des partenaires ou auteurs.",
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Mentions légales</p>
        <h1 className="text-4xl font-heading">Informations officielles</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 25 septembre 2025</p>
      </header>

      {sections.map((section) => (
        <section key={section.title} className="space-y-3 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {section.content.map((line, index) => (
              <li key={`${section.title}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
