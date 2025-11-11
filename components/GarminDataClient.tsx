"use client";

import { useEffect, useMemo, useState } from "react";
import type { TouchEvent } from "react";

import TrainingScoreGauge from "@/components/TrainingScoreGauge";
import type { GarminActivityHighlight, GarminDataBundle, GarminSection } from "@/lib/garminData";

type GarminDataClientProps = {
  initialData: GarminDataBundle;
};

const renderMetricValue = (value: string | null) => {
  if (value) {
    return <span className="text-base font-semibold text-white">{value}</span>;
  }

  return <span className="text-sm text-yellow-200">En attente de synchro</span>;
};

const ActivityCarousel = ({ activities }: { activities: GarminActivityHighlight[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (activities.length === 0) {
    return null;
  }

  const boundedIndex = Math.min(activeIndex, activities.length - 1);
  const current = activities[boundedIndex];

  const goToPrevious = () => {
    if (activities.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + activities.length) % activities.length);
  };

  const goToNext = () => {
    if (activities.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % activities.length);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? null;
    if (endX !== null) {
      const deltaX = endX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    }
    setTouchStartX(null);
  };

  const handleTouchCancel = () => {
    setTouchStartX(null);
  };

  const stats = [
    { label: "Durée", value: current.durationDisplay },
    { label: "Intensité", value: current.intensityDisplay },
    { label: "FC moyenne", value: current.heartRateDisplay },
    { label: "Puissance", value: current.powerDisplay },
    { label: "Cadence", value: current.cadenceDisplay },
    { label: "Calories", value: current.caloriesDisplay },
  ].filter((stat) => Boolean(stat.value));

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">
            Activité {boundedIndex + 1} / {activities.length}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{current.type ?? "Activité"}</h3>
          <p className="text-sm text-white/70">{current.startDisplay ?? "Date inconnue"}</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Activité précédente"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Activité suivante"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>
      {stats.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-white/50">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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
              <div className="space-y-4">
                {section.activities && section.activities.length > 0 ? (
                  <ActivityCarousel activities={section.activities} />
                ) : null}
                {section.items.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.items.map((item) => (
                      <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/50">{item.label}</p>
                        <div className="mt-2">{renderMetricValue(item.value)}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {section.items.length === 0 && (!section.activities || section.activities.length === 0) ? (
                  <p className="text-sm text-white/60">Aucune donnée disponible pour cette section pour l’instant.</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default GarminDataClient;
