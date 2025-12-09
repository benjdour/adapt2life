import type { Metadata } from "next";

import { Locale } from "@/lib/i18n/locales";

type AboutParagraph = { text: string; emphasize?: boolean };

type AboutCopy = {
  heroTag: string;
  heroTitle: string;
  introHeading: string;
  introParagraphs: AboutParagraph[];
  missionTitle: string;
  missionIntro: string;
  missionListIntro: string;
  missionList: string[];
  missionQuote: string;
  visionTitle: string;
  visionIntro: string;
  visionStatement: string;
  visionListIntro: string;
  visionList: string[];
  visionParagraph: string;
  trustTitle: string;
  trustParagraphs: string[];
  howTitle: string;
  howIntro: string;
  howList: string[];
  howParagraph: string;
  valuesTitle: string;
  valuesIntro: string;
  values: string[];
  outroTitle: string;
  outroParagraphs: string[];
};

const frCopy: AboutCopy = {
  heroTag: "À propos d’Adapt2Life",
  heroTitle: "À propos d’Adapt2Life",
  introHeading: "👋 Bonjour, je suis Benjamin",
  introParagraphs: [
    {
      text: "Sportif passionné depuis plus de 20 ans, adepte de triathlon, plusieurs fois finisher Ironman, marathonien régulier, ultratrailer, gestionnaire de projets numériques et père de famille de plus de 40 ans.",
      emphasize: true,
    },
    {
      text: "J’ai créé Adapt2Life pour répondre à un défi que connaissent énormément de sportifs amateurs : comment continuer à s’entraîner sérieusement, progresser et viser des objectifs ambitieux… tout en assumant pleinement la vie familiale, le travail et les responsabilités du quotidien ?",
    },
    {
      text: "Le sport fait partie de ma vie depuis toujours, mais jamais au détriment de ma famille ou de mon équilibre. Et pourtant, aucun plan d’entraînement traditionnel ne m’a permis de concilier ces deux mondes de manière réaliste.",
    },
  ],
  missionTitle: "🎯 Pourquoi Adapt2Life existe",
  missionIntro:
    "Avec plus de 20 ans d’expérience en endurance — triathlons, plusieurs Ironman, marathons, courses longues distances et ultra-trails — j’ai constaté une réalité simple : la vie ne suit pas un plan d’entraînement figé.",
  missionListIntro: "Un jour, tout va parfaitement. Le lendemain, c’est :",
  missionList: ["une nuit écourtée,", "un enfant malade,", "un horaire qui explose,", "un niveau d’énergie en chute libre,", "ou un imprévu de dernière minute."],
  missionQuote: "Le problème n’est pas la discipline. Le problème, c’est que les plans ne s’adaptent pas à la vie réelle.",
  visionTitle: "🔥 La vision Adapt2Life",
  visionIntro: "Une idée guide toute l’application :",
  visionStatement: "👉 Ton entraînement doit s’adapter à toi — jamais l’inverse.",
  visionListIntro: "Adapt2Life analyse :",
  visionList: [
    "ton niveau d’énergie,",
    "ta récupération,",
    "ton sommeil,",
    "ton stress,",
    "ta charge physique récente,",
    "ton temps disponible,",
    "ton contexte familial et professionnel,",
  ],
  visionParagraph:
    "…et génère la meilleure séance possible pour toi, aujourd’hui, dans ta vraie vie. Pas de rigidité. Pas de culpabilité. Juste une progression intelligente, durable et adaptée.",
  trustTitle: "🧠 Pourquoi me faire confiance ?",
  trustParagraphs: [
    "Parce que je suis exactement dans la même réalité que les utilisateurs d’Adapt2Life. Je m’entraîne pour des défis exigeants — triathlons, Ironman, marathons, ultratrails — mais je suis aussi un parent, un conjoint et un professionnel à temps plein.",
    "Je connais les journées chargées, la fatigue accumulée, les séances qu’on doit adapter ou raccourcir. Adapt2Life n’est pas une théorie : c’est un besoin personnel devenu une solution concrète.",
  ],
  howTitle: "⚙️ Comment fonctionne Adapt2Life ?",
  howIntro: "Adapt2Life combine :",
  howList: ["tes données Garmin,", "ton état du moment,", "la science de la progression,", "et la capacité d’adaptation de l’intelligence artificielle,"],
  howParagraph:
    "…pour créer une séance parfaitement ajustée à ton énergie, ton temps, ton contexte. Tu ouvres l’app. Tu demandes ta séance. Tu t’entraînes. Et tu avances — à ton rythme, mais toujours dans la bonne direction.",
  valuesTitle: "🤝 Nos valeurs",
  valuesIntro: "Le sport doit s’intégrer dans la vie, jamais l’écraser.",
  values: ["Adaptation", "Bienveillance", "Simplicité", "Progression durable", "Humanité"],
  outroTitle: "🌱 Une vision qui va plus loin",
  outroParagraphs: [
    "Adapt2Life répond à un besoin personnel… mais il répond surtout à un besoin universel : permettre à chacun de garder le sport dans sa vie de manière réaliste, équilibrée et motivante.",
    "On n’a pas besoin de plus de plans d’entraînement. On a besoin de plans qui respectent la personne derrière l’athlète. Et c’est exactement ce qu’Adapt2Life veut offrir. Ce n’est que le début.",
  ],
};

const ABOUT_COPY: Record<Locale, AboutCopy> = {
  fr: frCopy,
  en: frCopy,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

export const aboutMetadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "À propos — Adapt2Life",
    description:
      "Découvrez pourquoi Adapt2Life a été créé, la vision portée par Benjamin et la manière dont l’app adapte chaque séance à la vie réelle.",
    alternates: { canonical: `${siteUrl}/about` },
    openGraph: {
      url: `${siteUrl}/about`,
      title: "À propos d’Adapt2Life",
      description: "L’histoire d’Adapt2Life, sa mission et ses valeurs pour aider les sportifs à concilier vie réelle et entraînement.",
      type: "article",
    },
  },
  en: {
    title: "About — Adapt2Life",
    description: "Discover why Adapt2Life was created and how it adapts every workout to real life.",
    alternates: { canonical: `${siteUrl}/en/about` },
    openGraph: {
      url: `${siteUrl}/en/about`,
      title: "About Adapt2Life",
      description: "The story, mission and values behind Adapt2Life for athletes with real lives.",
      type: "article",
    },
  },
};

export const getAboutMetadata = (locale: Locale): Metadata => aboutMetadataByLocale[locale] ?? aboutMetadataByLocale.fr;

type AboutPageProps = {
  locale: Locale;
};

export function AboutPage({ locale }: AboutPageProps) {
  const copy = ABOUT_COPY[locale] ?? ABOUT_COPY.fr;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-3 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">{copy.heroTitle}</h1>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-6 space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.introHeading}</p>
        {copy.introParagraphs.map((paragraph) => (
          <p key={paragraph.text} className="text-base text-muted-foreground">
            {paragraph.emphasize ? <strong>{paragraph.text}</strong> : paragraph.text}
          </p>
        ))}
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">{copy.missionTitle}</h2>
        <p className="text-base text-muted-foreground">{copy.missionIntro}</p>
        <p className="text-base text-muted-foreground">{copy.missionListIntro}</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          {copy.missionList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-muted-foreground">
          <em>{copy.missionQuote}</em>
        </blockquote>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">{copy.visionTitle}</h2>
        <p className="text-base text-muted-foreground">{copy.visionIntro}</p>
        <p className="text-xl font-semibold text-primary">{copy.visionStatement}</p>
        <p className="text-base text-muted-foreground">{copy.visionListIntro}</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          {copy.visionList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-base text-muted-foreground">{copy.visionParagraph}</p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">{copy.trustTitle}</h2>
        {copy.trustParagraphs.map((paragraph) => (
          <p key={paragraph} className="text-base text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">{copy.howTitle}</h2>
        <p className="text-base text-muted-foreground">{copy.howIntro}</p>
        <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
          {copy.howList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-base text-muted-foreground">{copy.howParagraph}</p>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-3">
        <h2 className="text-3xl font-heading">{copy.valuesTitle}</h2>
        <p className="text-base text-muted-foreground">{copy.valuesIntro}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {copy.values.map((value) => (
            <div key={value} className="rounded-2xl border border-white/10 bg-card/80 p-4">
              <p className="text-lg font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-white/10" />

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">{copy.outroTitle}</h2>
        {copy.outroParagraphs.map((paragraph) => (
          <p key={paragraph} className="text-base text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
}
