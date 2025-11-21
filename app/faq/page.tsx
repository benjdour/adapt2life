import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const faqItems = [
  {
    question: "Qu’est-ce qu’Adapt2Life ?",
    answer:
      "Adapt2Life est un coach IA qui génère des séances sur-mesure à partir de ton ressenti, de tes contraintes et de tes données Garmin afin d’adapter l’entraînement à ta vie réelle.",
  },
  {
    question: "Comment l’IA personnalise-t-elle un entraînement ?",
    answer:
      "Tu décris ta forme, tes objectifs et ton matériel disponible. L’IA combine ces informations avec ton historique pour proposer une séance cohérente (échauffement, bloc principal, retour au calme).",
  },
  {
    question: "Puis-je envoyer mes séances sur ma montre Garmin ?",
    answer:
      "Oui. Après génération, Adapt2Life convertit automatiquement la séance en JSON compatible Garmin et l’envoie dans ton calendrier Garmin Connect.",
  },
  {
    question: "Quels sports sont pris en charge aujourd’hui ?",
    answer:
      "Nous couvrons vélo, course, natation, triathlon et la préparation physique générale. D’autres disciplines arrivent progressivement.",
  },
  {
    question: "Combien de temps prend la génération d’une séance ?",
    answer:
      "En moyenne quelques secondes. Sur les modèles reasoning (conversion Garmin), cela peut prendre jusqu’à deux minutes lorsque la demande est complexe.",
  },
  {
    question: "Les séances sont-elles adaptées au niveau débutant ?",
    answer:
      "Oui. L’IA tient compte de ton niveau, de ton volume disponible et propose des consignes claires même si tu débutes.",
  },
  {
    question: "Je n’ai pas de capteur de puissance, est-ce bloquant ?",
    answer:
      "Non. Tu peux mentionner que tu roules à la sensation ou à la fréquence cardiaque. L’IA adaptera les zones et indicateurs.",
  },
  {
    question: "Puis-je regénérer une séance si elle ne me convient pas ?",
    answer:
      "Bien sûr. Tu peux relancer le générateur autant de fois que nécessaire ou ajuster le brief pour préciser ce que tu veux.",
  },
  {
    question: "Comment Adapt2Life utilise mes données Garmin ?",
    answer:
      "Les données servent uniquement à personnaliser tes séances (charge, historique récent). Elles sont stockées de façon sécurisée et tu peux retirer l’accès à tout moment.",
  },
  {
    question: "Puis-je utiliser Adapt2Life sans montre connectée ?",
    answer:
      "Oui. Tu peux générer des plans uniquement avec ton ressenti. Les données Garmin ajoutent simplement plus de contexte.",
  },
  {
    question: "Y a-t-il un engagement ou un abonnement long terme ?",
    answer:
      "Non. Tu peux tester gratuitement et choisir l’offre mensuelle ou annuelle selon ton usage, sans engagement caché.",
  },
  {
    question: "Comment fonctionne la période d’essai ?",
    answer:
      "Tu crées ton compte, connectes Garmin si tu le souhaites et génères plusieurs séances gratuitement avant de choisir un abonnement.",
  },
  {
    question: "Puis-je suivre un plan structuré sur plusieurs semaines ?",
    answer:
      "Nous proposons un générateur jour par jour, mais tu peux sauvegarder tes séances et les organiser dans Garmin. Un mode plan multi-semaines est en préparation.",
  },
  {
    question: "Comment sont gérées les récupérations et les repos ?",
    answer:
      "L’IA suggère automatiquement des jours plus légers ou des séances axées récupération active dès que tes paramètres indiquent de la fatigue.",
  },
  {
    question: "L’IA tient-elle compte de mes blessures ou contraintes médicales ?",
    answer:
      "Tu peux préciser toute restriction dans le brief (ex. pas de saut, pas de travail en danseuse). L’IA adaptera la séance en conséquence, mais cela ne remplace pas un avis médical.",
  },
  {
    question: "Comment garantir que les séances respectent les standards Garmin ?",
    answer:
      "Chaque séance est validée par un schéma strict (Garmin Training API V2) puis nettoyée automatiquement (cibles, durées, segments) avant l’envoi.",
  },
  {
    question: "Puis-je partager mes séances avec mon coach humain ?",
    answer:
      "Oui. Tu peux exporter le plan en Markdown, en JSON Garmin ou simplement partager le lien généré vers Garmin Connect.",
  },
  {
    question: "Que se passe-t-il si la conversion Garmin échoue ?",
    answer:
      "Tu es informé immédiatement. Nous loguons la raison (JSON invalide, API Garmin indisponible) et tu peux regénérer ou envoyer le plan plus tard.",
  },
  {
    question: "Adapt2Life fonctionne-t-il hors connexion ?",
    answer:
      "Non. Les générations s’appuient sur nos serveurs et sur les API partenaires. Une connexion Internet est nécessaire pour créer ou envoyer un entraînement.",
  },
  {
    question: "Comment contacter l’équipe en cas de question ?",
    answer:
      "Tu peux utiliser le formulaire de contact, nous écrire à support@adapt2life.app ou rejoindre la communauté Discord pour échanger directement avec l’équipe.",
  },
];

export const metadata: Metadata = {
  title: "FAQ — Adapt2Life",
  description: "Toutes les réponses aux questions fréquentes sur Adapt2Life, son IA et l’intégration Garmin.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-primary/80">FAQ</p>
        <h1 className="text-4xl font-heading">Tout savoir sur Adapt2Life</h1>
        <p className="text-base text-muted-foreground">
          Nous avons compilé les questions les plus fréquentes sur la génération IA, l’intégration Garmin et la sécurité de
          tes données.
        </p>
      </header>

      <section className="space-y-4">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-white/10 bg-card/80 p-6 transition hover:border-primary/40"
          >
            <summary className="cursor-pointer list-none text-left text-lg font-heading leading-tight text-foreground">
              {item.question}
              <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Besoin d’aide</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-heading text-foreground">Tu n’as pas trouvé ta réponse ?</h2>
            <p className="text-sm text-muted-foreground">
              Contacte notre équipe ou rejoins la communauté pour échanger avec d’autres athlètes Adapt2Life.
            </p>
          </div>
          <Button asChild size="lg" className="px-6 text-base font-semibold">
            <Link href="/contact">Contacter l’équipe</Link>
          </Button>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
