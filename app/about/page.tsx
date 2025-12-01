import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "À propos — Adapt2Life",
  description:
    "Pourquoi Adapt2Life existe, qui l’a créé et comment l’application adapte chaque séance à la vie réelle des sportifs connectés.",
};

const values = ["Adaptation", "Bienveillance", "Simplicité", "Progression durable", "Humanité"];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">À propos d’Adapt2Life</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">&laquo; La vie ne respecte pas les plans &raquo;</h1>
        <p className="text-base text-muted-foreground">
          Bonjour, je suis Benjamin. Sportif passionné depuis plus de 20 ans, triathlète de compétition, marathonien, ultratrailer, chef de
          projets numériques et papa quadragénaire. Adapt2Life est né d’une question qui m’a suivi toute ma vie adulte&nbsp;: comment continuer à
          m’entraîner sérieusement, progresser et performer, tout en assumant pleinement ma vie familiale et mes responsabilités quotidiennes&nbsp;?
        </p>
        <p className="text-base text-muted-foreground">
          Je n’ai jamais voulu choisir entre ma passion du sport et ma vie de famille. Pourtant, aucun plan d’entraînement classique ne me
          donnait cette flexibilité. Les plans restaient figés. Moi, non. Mes journées non plus. C’est là qu’est née l’idée d’Adapt2Life :
          <strong> ce n’est pas toi qui dois t’adapter à ton plan, c’est ton plan qui doit s’adapter à ta vie.</strong>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Pourquoi Adapt2Life existe</h2>
        <p className="text-base text-muted-foreground">
          En plus de 20 ans de pratique (triathlon, course à pied, marathons, ultra-trails), j’ai testé des plans rigides, des progressions
          linéaires, des semaines structurées au millimètre. Résultat&nbsp;: la vie réelle gagnait toujours. Une nuit trop courte, un imprévu
          avec les enfants, une journée de travail qui déborde… et le plan ne collait plus. Adapt2Life est la réponse à cette réalité.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">La vision Adapt2Life</h2>
        <p className="text-base text-muted-foreground">
          L’application lit ton énergie, ta récupération, ton sommeil, ton stress, ta charge physique, ton temps disponible et ton contexte
          familial/professionnel pour générer, en temps réel, la meilleure séance possible pour toi, ce jour-là.
        </p>
        <p className="text-base text-muted-foreground">
          Pas un programme figé. Un système intelligent, vivant, flexible. Ton entraînement évolue avec toi, pas contre toi.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Pourquoi me faire confiance&nbsp;?</h2>
        <p className="text-base text-muted-foreground">
          Parce que je vis exactement ce que vivent les utilisateurs d’Adapt2Life. Je prépare des compétitions exigeantes tout en jonglant avec
          le travail, la famille, les imprévus et la fatigue. Adapt2Life n’est pas une idée née dans un bureau : c’est une solution créée sur
          le terrain car elle manquait réellement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Comment ça fonctionne&nbsp;?</h2>
        <p className="text-base text-muted-foreground">
          Adapt2Life combine tes données Garmin, ton état du moment, la science de la progression et l’intelligence artificielle pour générer
          une séance réaliste, personnalisée et compatible avec ta journée. Tu ouvres l’app, tu demandes ta séance, tu t’entraînes… et tu
          progresses, sans culpabilité et sans rigidité inutile.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Nos valeurs</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {values.map((value) => (
            <Card key={value} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">{value}</CardTitle>
                <CardDescription>
                  {value === "Simplicité"
                    ? "Le sport n’a pas besoin d’être compliqué pour être efficace."
                    : value === "Adaptation"
                      ? "Ta vie change : ton entraînement aussi."
                      : value === "Progression durable"
                        ? "On privilégie la constance plutôt que les pics éphémères."
                        : value === "Humanité"
                          ? "L’IA accompagne l’athlète, elle ne le remplace pas."
                          : "Chaque recommandation est formulée avec respect et bienveillance."}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Sécurité & confiance</h2>
        <p className="text-base text-muted-foreground">
          Tes données sont à toi. Adapt2Life respecte la confidentialité et n’utilise que les éléments nécessaires pour t’aider à
          t’entraîner. Nous mettons en place des protections techniques et contractuelles fortes, et tu peux révoquer l’accès à tout moment.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-heading">Une vision qui va plus loin</h2>
        <p className="text-base text-muted-foreground">
          Adapt2Life est né d’un besoin personnel, mais répond à un besoin plus large : aider chacun à intégrer le sport de manière réaliste et
          durable, quel que soit son âge ou son rythme de vie. On ne manque pas d’applications d’entraînement, on manque de solutions qui
          respectent la personne derrière l’athlète. Adapt2Life est là pour ça. Et ce n’est que le début.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/handler/sign-in?redirect=/generateur-entrainement">Tester Adapt2Life</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Parler à l’équipe</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
