import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Adapt2Life",
  description: "Politique complète sur la collecte, l’utilisation et la protection des données personnelles sur Adapt2Life.",
};

export const dynamic = "force-static";
export const revalidate = false;

const sections = [
  {
    title: "1. Introduction",
    content: [
      'Bienvenue sur Adapt2Life. Nous nous engageons à une transparence maximale concernant la protection de vos données personnelles. La présente politique explique la nature, la finalité et la base légale du traitement de vos données lorsque vous utilisez notre site et notre application (« le Service »), où que vous soyez. En accédant au Service, vous reconnaissez avoir lu et accepté cette politique.',
    ],
  },
  {
    title: "2. Données personnelles collectées",
    content: [
      "2.1 Données fournies directement :",
      "- Données de compte : adresse e-mail et nom lors de la création d’un compte ou à la prise de contact.",
      "- Données de communication : contenu des messages envoyés au support.",
      "- Données d’abonnement : type de plan choisi (Starter, Momentum, Peak, Elite, Ultra), quotas restants, identifiants techniques associés à votre plan.",
      "2.2 Données Garmin collectées via l’API :",
      "- Données d’activité : type d’activité (course, vélo, etc.), date/heure de début et fin, durée, distance, allure, calories, fréquence cardiaque, données GPS et altitude.",
      "- Données de santé et bien-être : sommeil, niveaux de stress, variabilité de la fréquence cardiaque (HRV), score Body Battery, suivi des cycles menstruels (si activé).",
      "2.3 Données collectées automatiquement :",
      "- Informations techniques : adresse IP, identifiants d’appareil, système d’exploitation, type de navigateur.",
      "- Informations d’usage : pages consultées, fréquence d’utilisation, fonctionnalités utilisées.",
    ],
  },
  {
    title: "3. Utilisation des données",
    content: [
      "Nous utilisons les données collectées pour :",
      "- Fournir le Service (connexion et génération de plans personnalisés).",
      "- Personnaliser les entraînements à partir des données Garmin.",
      "- Assurer la sécurité (détection d’activités frauduleuses).",
      "- Gérer les quotas d’utilisation (Starter ne se recharge pas ; Momentum/Peak/Elite/Ultra sont remis à zéro automatiquement chaque 1er du mois).",
      "- Améliorer le Service grâce à des données anonymisées.",
    ],
  },
  {
    title: "4. Partage et divulgation",
    content: [
      "Nous ne vendons ni ne louons vos données. Les partages se limitent à :",
      "- Garmin : envoi des entraînements générés pour synchronisation.",
      "- Fournisseurs IA (via OpenRouter) : transmission de données anonymisées pour générer les plans.",
      "- Prestataires tiers (Vercel, AWS, etc.) : hébergement et services cloud.",
    ],
  },
  {
    title: "5. Paiements & gestion d’abonnement",
    content: [
      "- Paiements : nous utilisons Stripe pour traiter les paiements (carte bancaire, Apple Pay, etc.). Stripe agit en tant que sous-traitant et collecte certaines données de paiement (numéro de carte, adresse, code postal) conformément à sa politique de confidentialité. Adapt2Life ne stocke jamais les informations complètes de carte ; seuls les identifiants techniques de client/abonnement Stripe (customerId, subscriptionId, priceId) sont conservés.",
      "- Gestion d’abonnement : les changements de plan (upgrade/downgrade) sont gérés via l’espace Profil (bouton « Gérer mon abonnement » qui ouvre le portail client Stripe) ou sur demande auprès du support. Les annulations prennent effet à la fin de la période de facturation.",
      "- Facturation & supports : les e-mails transactionnels (confirmation de paiement, alertes) sont envoyés via Resend. Ils contiennent uniquement les informations nécessaires au suivi de facturation.",
    ],
  },
  {
    title: "6. Transferts internationaux",
    content: [
      "Vos données peuvent être stockées sur des serveurs hors de votre juridiction. Des garanties appropriées sont mises en place.",
      "Utilisateurs du Québec : Adapt2Life effectue une Évaluation des facteurs relatifs à la vie privée (PIA) pour les transferts hors province.",
    ],
  },
  {
    title: "7. Vos droits",
    content: [
      "6.1 Droits pour tous : rectification des données inexactes.",
      "6.2 Droits EEE/UK (RGPD) : accès, portabilité, effacement, opposition.",
      "6.3 Droits Québec/Canada (Loi 64 / PIPEDA) : portabilité, retrait du consentement.",
      "6.4 Droits Californie (CCPA/CPRA) : droit de savoir, suppression, opposition à la vente des données.",
    ],
  },
  {
    title: "8. Conservation des données",
    content: [
      "Les données sont conservées tant que le compte est actif. En cas de suppression du compte, les données sont supprimées.",
    ],
  },
  {
    title: "9. Cookies et technologies similaires",
    content: [
      "Nous utilisons des cookies pour assurer le bon fonctionnement du site et analyser l’usage de façon anonyme. Vous pouvez configurer votre navigateur pour refuser les cookies.",
    ],
  },
  {
    title: "10. Confidentialité des mineurs",
    content: [
      "Le Service s’adresse aux personnes de 16 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs de moins de 16 ans.",
    ],
  },
  {
    title: "11. Nous contacter",
    content: [
      "Responsable de la protection des données : Benjamin Dour.",
      "Contact : contact@adapt2life.app",
    ],
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Politique de confidentialité</p>
        <h1 className="text-4xl font-heading">Protéger vos données, notre priorité</h1>
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
