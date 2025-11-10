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

      {!data.connection ? (
        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-white">Aucune connexion Garmin</p>
          <p className="text-sm text-white/70">Relie ton compte via la page d’intégration pour voir les données apparaître ici.</p>
        </section>
      ) : null}

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
