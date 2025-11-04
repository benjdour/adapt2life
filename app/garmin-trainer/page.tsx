import Link from "next/link";

export default function GarminTrainerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="space-y-8 text-center">
        <h1 className="text-3xl font-semibold">Générateur d’entraînements Garmin</h1>
        <p className="text-sm text-white/70">Fonctionnalité en cours de construction.</p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 bg-transparent px-6 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
