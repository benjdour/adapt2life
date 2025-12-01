import type { Metadata } from "next";

const values = ["Adaptation", "Bienveillance", "Simplicité", "Progression durable", "Humanité"];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

export const metadata: Metadata = {
  title: "À propos — Adapt2Life",
  description:
    "Découvrez pourquoi Adapt2Life a été créé, la vision portée par Benjamin et la manière dont l’app adapte chaque séance à la vie réelle.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    url: `${siteUrl}/about`,
    title: "À propos d’Adapt2Life",
    description:
      "L’histoire d’Adapt2Life, sa mission et ses valeurs pour aider les sportifs à concilier vie réelle et entraînement.",
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-3 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">À propos d’Adapt2Life</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">À propos d’Adapt2Life</h1>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-6 space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">👋 Bonjour, je suis Benjamin</p>
        <p className="text-base text-muted-foreground">
          <strong>
            Sportif passionné depuis plus de 20 ans, adepte de triathlon, plusieurs fois finisher Ironman, marathonien régulier, ultratrailer,
            gestionnaire de projets numériques et père de famille de plus de 40 ans.
          </strong>
        </p>
        <p className="text-base text-muted-foreground">
          J’ai créé Adapt2Life pour répondre à un défi que connaissent énormément de sportifs amateurs&nbsp;: <strong>
            comment continuer à s’entraîner sérieusement, progresser et viser des objectifs ambitieux… tout en assumant pleinement la vie familiale,
            le travail et les responsabilités du quotidien&nbsp;?
          </strong>
        </p>
        <p className="text-base text-muted-foreground">
          Le sport fait partie de ma vie depuis toujours, mais jamais au détriment de ma famille ou de mon équilibre. Et pourtant, aucun plan
          d’entraînement traditionnel ne m’a permis de concilier ces deux mondes de manière réaliste.
        </p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">🎯 Pourquoi Adapt2Life existe</h2>
        <p className="text-base text-muted-foreground">
          Avec plus de 20 ans d’expérience en endurance — triathlons, plusieurs Ironman, marathons, courses longues distances et ultra-trails — j’ai
          constaté une réalité simple&nbsp;: <strong>la vie ne suit pas un plan d’entraînement figé.</strong>
        </p>
        <p className="text-base text-muted-foreground">Un jour, tout va parfaitement. Le lendemain, c’est :</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          <li>une nuit écourtée,</li>
          <li>un enfant malade,</li>
          <li>un horaire qui explose,</li>
          <li>un niveau d’énergie en chute libre,</li>
          <li>ou un imprévu de dernière minute.</li>
        </ul>
        <p className="text-base text-muted-foreground">
          Et pourtant, les plans restent rigides. Ils ne s’adaptent pas à notre réalité… alors que c’est exactement ce dont on a besoin.
        </p>
        <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-muted-foreground">
          <em>Le problème n’est pas la discipline. Le problème, c’est que les plans ne s’adaptent pas à la vie réelle.</em>
        </blockquote>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">🔥 La vision Adapt2Life</h2>
        <p className="text-base text-muted-foreground">Une idée guide toute l’application :</p>
        <p className="text-xl font-semibold text-primary">👉 Ton entraînement doit s’adapter à toi — jamais l’inverse.</p>
        <p className="text-base text-muted-foreground">Adapt2Life analyse :</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          <li>ton niveau d’énergie,</li>
          <li>ta récupération,</li>
          <li>ton sommeil,</li>
          <li>ton stress,</li>
          <li>ta charge physique récente,</li>
          <li>ton temps disponible,</li>
          <li>ton contexte familial et professionnel,</li>
        </ul>
        <p className="text-base text-muted-foreground">
          …et génère <strong>la meilleure séance possible pour toi</strong>, aujourd’hui, dans ta vraie vie. Pas de rigidité. Pas de culpabilité. Juste une
          progression intelligente, durable et adaptée.
        </p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">🧠 Pourquoi me faire confiance ?</h2>
        <p className="text-base text-muted-foreground">
          Parce que je suis exactement dans la même réalité que les utilisateurs d’Adapt2Life. Je m’entraîne pour des défis exigeants — triathlons,
          Ironman, marathons, ultratrails — mais je suis aussi un parent, un conjoint et un professionnel à temps plein.
        </p>
        <p className="text-base text-muted-foreground">
          Je connais les journées chargées, la fatigue accumulée, les séances qu’on doit adapter ou raccourcir. Adapt2Life n’est pas une théorie&nbsp;:
          c’est un besoin personnel devenu une solution concrète.
        </p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">⚙️ Comment fonctionne Adapt2Life ?</h2>
        <p className="text-base text-muted-foreground">Adapt2Life combine :</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          <li>tes données Garmin,</li>
          <li>ton état du moment,</li>
          <li>la science de la progression,</li>
          <li>et la capacité d’adaptation de l’intelligence artificielle,</li>
        </ul>
        <p className="text-base text-muted-foreground">
          …pour créer une séance parfaitement ajustée à <strong>ton</strong> énergie, <strong>ton</strong> temps, <strong>ton</strong> contexte. Tu ouvres l’app. Tu demandes ta séance. Tu
          t’entraînes. Et tu avances — à ton rythme, mais toujours dans la bonne direction.
        </p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-3">
        <h2 className="text-3xl font-heading">🤝 Nos valeurs</h2>
        <p className="text-base text-muted-foreground">Le sport doit s’intégrer dans la vie, jamais l’écraser.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {values.map((value) => (
            <div key={value} className="rounded-2xl border border-white/10 bg-card/80 p-4">
              <p className="text-lg font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">🌱 Une vision qui va plus loin</h2>
        <p className="text-base text-muted-foreground">
          Adapt2Life répond à un besoin personnel… mais il répond surtout à un besoin universel&nbsp;: <strong>
            permettre à chacun de garder le sport dans sa vie de manière réaliste, équilibrée et motivante.
          </strong>
        </p>
        <p className="text-base text-muted-foreground">
          On n’a pas besoin de plus de plans d’entraînement. On a besoin de plans qui respectent la personne derrière l’athlète. Et c’est exactement
          ce qu’Adapt2Life veut offrir. Ce n’est que le début.
        </p>
      </section>
    </main>
  );
}
