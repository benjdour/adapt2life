"use client";

import { useEffect, useMemo, useState } from "react";

import TrainingScoreGauge from "@/components/TrainingScoreGauge";
import type { GarminDataBundle, GarminSection } from "@/lib/garminData";

type GarminDataClientProps = {
  initialData: GarminDataBundle;
};

const renderMetricValue = (value: string | null) => {
  if (value) {
    return <span className="text-base font-semibold text-white">{value}</span>;
  }

  return <span className="text-sm text-yellow-200">En attente de synchro</span>;
};

const displayDate = (isoString: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("fr-FR", { hour12: false });
  } catch {
    return isoString;
  }
};

const GarminDataClient = ({ initialData }: GarminDataClientProps) => {
  const [data, setData] = useState<GarminDataBundle>(initialData);

  useEffect(() => {
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const response = await fetch("/api/garmin-data", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as GarminDataBundle;
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        // Silent retry on next interval
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const sections: GarminSection[] = useMemo(() => data.sections ?? [], [data.sections]);

  return (
    <>
      <TrainingScoreGauge data={data.trainingGaugeData} />

      {data.connection ? (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <div>
            <p className="text-sm font-medium text-white/90">Garmin userId</p>
            <p className="font-mono text-base text-emerald-200">{data.connection.garminUserId ?? "—"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Dernière mise à jour : <strong className="text-white">{displayDate(data.connection.updatedAt)}</strong>
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Token valide jusqu&apos;au :{" "}
              <strong className="text-white">{displayDate(data.connection.accessTokenExpiresAt)}</strong>
            </span>
          </div>
          <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <p className="font-semibold">Sources Garmin Health API</p>
            <p className="text-emerald-100/80">
              Les métriques ci-dessous proviennent des endpoints documentés dans <code>docs/Garmin_Health_API_1.2.2.md</code> et{" "}
              <code>docs/Activity_API-1.2.3_0.md</code>. Les cartes marquées &laquo; En attente de synchro &raquo; indiquent les endpoints
              à activer ou consommer.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-white">Aucune connexion Garmin</p>
          <p className="text-sm text-white/70">Relie ton compte via la page d’intégration pour voir les données apparaître ici.</p>
        </section>
      )}

      {data.connection ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
              <header className="mb-4 space-y-1">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                {section.description ? <p className="text-sm text-white/70">{section.description}</p> : null}
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">{item.label}</p>
                    <div className="mt-2">{renderMetricValue(item.value)}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default GarminDataClient;

