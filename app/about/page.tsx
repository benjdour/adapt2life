import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — Adapt2Life",
  description:
    "Découvrez la vision d’Adapt2Life, son fondateur Benjamin et la manière dont l’application adapte chaque séance à la vie réelle des sportifs.",
};

export default function AboutPage() {
  return (
    <main className="prose prose-invert mx-auto max-w-3xl px-6 py-12">
      <h1>À propos d’Adapt2Life</h1>

      <h2>👋 Bonjour, je suis Benjamin</h2>
      <p>
        <strong>
          Sportif passionné depuis plus de 20 ans, adepte de triathlon, plusieurs fois finisher Ironman, marathonien régulier, ultratrailer,
          gestionnaire de projets numériques et père de famille de plus de 40 ans.
        </strong>
      </p>
      <p>
        J’ai créé Adapt2Life pour répondre à un défi que connaissent énormément de sportifs amateurs&nbsp;: <strong>
          comment continuer à s’entraîner sérieusement, progresser et viser des objectifs ambitieux… tout en assumant pleinement la vie familiale,
          le travail et les responsabilités du quotidien&nbsp;?
        </strong>
      </p>
      <p>
        Le sport fait partie de ma vie depuis toujours, mais jamais au détriment de ma famille ou de mon équilibre. Et pourtant, aucun plan
        d’entraînement traditionnel ne m’a permis de concilier ces deux mondes de manière réaliste.
      </p>

      <hr />

      <h2>🎯 Pourquoi Adapt2Life existe</h2>
      <p>
        Avec plus de 20 ans d’expérience en endurance — triathlons, plusieurs Ironman, marathons, courses longues distances et ultra-trails — j’ai
        constaté une réalité simple&nbsp;: <strong>la vie ne suit pas un plan d’entraînement figé.</strong>
      </p>
      <p>Un jour, tout va parfaitement. Le lendemain, c’est :</p>
      <ul>
        <li>une nuit écourtée,</li>
        <li>un enfant malade,</li>
        <li>un horaire qui explose,</li>
        <li>un niveau d’énergie en chute libre,</li>
        <li>ou un imprévu de dernière minute.</li>
      </ul>
      <p>Et pourtant, les plans restent rigides. Ils ne s’adaptent pas à notre réalité… alors que c’est exactement ce dont on a besoin.</p>
      <blockquote>
        <em>Le problème n’est pas la discipline. Le problème, c’est que les plans ne s’adaptent pas à la vie réelle.</em>
      </blockquote>

      <hr />

      <h2>🔥 La vision Adapt2Life</h2>
      <p>Une idée guide toute l’application :</p>
      <h3>👉 Ton entraînement doit s’adapter à toi — jamais l’inverse.</h3>
      <p>Adapt2Life analyse :</p>
      <ul>
        <li>ton niveau d’énergie,</li>
        <li>ta récupération,</li>
        <li>ton sommeil,</li>
        <li>ton stress,</li>
        <li>ta charge physique récente,</li>
        <li>ton temps disponible,</li>
        <li>ton contexte familial et professionnel,</li>
      </ul>
      <p>
        …et génère <strong>la meilleure séance possible pour toi</strong>, aujourd’hui, dans ta vraie vie. Pas de rigidité. Pas de culpabilité. Juste une
        progression intelligente, durable et adaptée.
      </p>

      <hr />

      <h2>🧠 Pourquoi me faire confiance&nbsp;?</h2>
      <p>
        Parce que je suis exactement dans la même réalité que les utilisateurs d’Adapt2Life. Je m’entraîne pour des défis exigeants — triathlons,
        Ironman, marathons, ultratrails — mais je suis aussi un parent, un conjoint et un professionnel à temps plein.
      </p>
      <p>
        Je connais les journées chargées, la fatigue accumulée, les séances qu’on doit adapter ou raccourcir. Adapt2Life n’est pas une théorie&nbsp;: c’est
        un besoin personnel devenu une solution concrète.
      </p>

      <hr />

      <h2>⚙️ Comment fonctionne Adapt2Life&nbsp;?</h2>
      <p>Adapt2Life combine :</p>
      <ul>
        <li>tes données Garmin,</li>
        <li>ton état du moment,</li>
        <li>la science de la progression,</li>
        <li>et la capacité d’adaptation de l’intelligence artificielle,</li>
      </ul>
      <p>
        …pour créer une séance parfaitement ajustée à <strong>ton</strong> énergie, <strong>ton</strong> temps, <strong>ton</strong> contexte. Tu ouvres l’app. Tu demandes ta séance. Tu
        t’entraînes. Et tu avances — à ton rythme, mais toujours dans la bonne direction.
      </p>

      <hr />

      <h2>🤝 Nos valeurs</h2>
      <ul>
        <li><strong>Adaptation</strong></li>
        <li><strong>Bienveillance</strong></li>
        <li><strong>Simplicité</strong></li>
        <li><strong>Progression durable</strong></li>
        <li><strong>Humanité</strong></li>
      </ul>
      <p>Le sport doit s’intégrer dans la vie, jamais l’écraser.</p>

      <hr />

      <h2>🌱 Une vision qui va plus loin</h2>
      <p>
        Adapt2Life répond à un besoin personnel… mais il répond surtout à un besoin universel&nbsp;: <strong>
          permettre à chacun de garder le sport dans sa vie de manière réaliste, équilibrée et motivante.
        </strong>
      </p>
      <p>
        On n’a pas besoin de plus de plans d’entraînement. On a besoin de plans qui respectent la personne derrière l’athlète. Et c’est exactement ce
        qu’Adapt2Life veut offrir. Ce n’est que le début.
      </p>
    </main>
  );
}
