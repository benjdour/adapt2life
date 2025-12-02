import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d’utilisation — Adapt2Life",
  description: "Conditions générales d’utilisation du service Adapt2Life.",
};

export const dynamic = "force-static";
export const revalidate = false;

const sections = [
  {
    title: "1. Acceptation des conditions",
    content: [
      "En accédant ou en utilisant l’application Adapt2Life (« le Service »), vous acceptez d’être lié par les présentes conditions d’utilisation (« Conditions »). Si vous n’êtes pas d’accord avec une partie quelconque de ces conditions, vous ne pouvez pas accéder au Service.",
    ],
  },
  {
    title: "2. Comptes utilisateurs",
    content: [
      "Lorsque vous créez un compte, vous devez fournir des informations exactes et complètes. Vous êtes responsable de la protection de votre mot de passe ainsi que de toute activité effectuée avec ce mot de passe.",
    ],
  },
  {
    title: "3. Propriété intellectuelle",
    content: [
      "Le Service et son contenu original, ses fonctionnalités et ses composants demeurent la propriété exclusive d’Adapt2Life Inc. et de ses concédants.",
    ],
  },
  {
    title: "4. Contenu utilisateur",
    content: [
      "Vous êtes responsable de tout contenu que vous publiez via le Service. Vous accordez à Adapt2Life une licence non exclusive, mondiale et libre de redevance pour utiliser, modifier et distribuer tout contenu que vous fournissez via le Service.",
    ],
  },
  {
    title: "5. Paiements & abonnements",
    content: [
      "Les paiements des plans Starter (usage unique), Momentum, Peak, Elite et Ultra (accès restreint) sont traités via Stripe. En souscrivant, vous autorisez Adapt2Life et Stripe à débiter le moyen de paiement enregistré selon la périodicité choisie (mensuelle ou annuelle).",
      "Starter offre 10 générations et 5 conversions gratuites une seule fois. Les plans payants mensuels ou annuels voient leurs quotas remis à zéro automatiquement chaque 1er du mois — même en cas de facturation annuelle.",
      "Les abonnements sont reconduits automatiquement jusqu’à annulation. Vous pouvez gérer ou annuler votre abonnement depuis la page Profil (lien « Gérer mon abonnement » qui ouvre le portail client Stripe) ou en contactant le support (contact@adapt2life.app). L’annulation prend effet à la fin de la période en cours. Aucune pénalité de résiliation anticipée n’est appliquée.",
      "En cas de fraude, de non-respect des présentes conditions, d’échec répété de paiement ou de violation manifeste de la politique d’utilisation, Adapt2Life se réserve le droit de suspendre ou résilier l’accès.",
    ],
  },
  {
    title: "6. Liens vers d’autres sites",
    content: [
      "Le Service peut contenir des liens vers des sites web ou services tiers qui ne sont pas détenus ou contrôlés par Adapt2Life. Nous n’avons aucun contrôle sur le contenu ni sur les politiques de confidentialité de ces sites tiers.",
    ],
  },
  {
    title: "7. Exclusion de garanties",
    content: [
      "Le Service est fourni « tel quel » et « selon disponibilité ». Adapt2Life n’émet aucune garantie, expresse ou implicite, relative au Service. Nous ne garantissons pas que le Service sera ininterrompu, sécurisé ou exempt d’erreurs.",
    ],
  },
  {
    title: "8. Limitation de responsabilité",
    content: [
      "Adapt2Life, ses dirigeants, employés ou partenaires ne pourront en aucun cas être tenus responsables des dommages indirects, accidentels, spéciaux ou consécutifs, y compris notamment les pertes de profits, de données, d’usage, de clientèle ou autres pertes intangibles résultant de votre accès ou utilisation du Service.",
    ],
  },
  {
    title: "9. Loi applicable",
    content: [
      "Les présentes Conditions sont régies et interprétées conformément aux lois du Québec, Canada, sans égard aux principes de conflits de lois.",
    ],
  },
  {
    title: "10. Modifications des Conditions",
    content: [
      "Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Conditions à tout moment.",
    ],
  },
];

export default function ConditionsUtilisationPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Conditions d’utilisation</p>
        <h1 className="text-4xl font-heading">Utiliser Adapt2Life en toute confiance</h1>
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
