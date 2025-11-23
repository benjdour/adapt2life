"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { TouchEvent } from "react";

import TrainingScoreGauge from "@/components/TrainingScoreGauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GarminActivityHighlight, GarminDataBundle, GarminSection } from "@/lib/garminData";

type GarminDataClientProps = {
  initialData: GarminDataBundle;
};

const renderMetricValue = ({
  value,
  hasSyncedOnce,
}: {
  value: string | null;
  hasSyncedOnce: boolean;
}) => {
  if (value) {
    return <span className="text-base font-semibold text-foreground">{value}</span>;
  }
  if (hasSyncedOnce) {
    return <span className="text-sm text-warning">En attente de synchro</span>;
  }
  return null;
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
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Activité {boundedIndex + 1} / {activities.length}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{current.type ?? "Activité"}</h3>
          <p className="text-sm text-muted-foreground">{current.startDisplay ?? "Date inconnue"}</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Activité précédente"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-foreground transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Activité suivante"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-foreground transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>
      {stats.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const GarminDataClient = ({ initialData }: GarminDataClientProps) => {
  const [data, setData] = useState<GarminDataBundle>(initialData);
  const hasShownErrorRef = useRef(false);

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
          if (!hasShownErrorRef.current) {
            toast.error("Impossible d’actualiser les données Garmin.", {
              description: "Dernière synchronisation indisponible. Vérifie ta connexion ou réessaie plus tard.",
            });
            hasShownErrorRef.current = true;
          }
          return;
        }
        const payload = (await response.json()) as GarminDataBundle;
        if (!cancelled) {
          setData(payload);
          if (hasShownErrorRef.current) {
            toast.success("Données Garmin mises à jour", {
              description: "La connexion est rétablie, les dernières mesures sont affichées.",
            });
            hasShownErrorRef.current = false;
          }
        }
      } catch {
        if (!hasShownErrorRef.current) {
          toast.error("Impossible d’actualiser les données Garmin.", {
            description: "Dernière synchronisation indisponible. Vérifie ta connexion ou réessaie plus tard.",
          });
          hasShownErrorRef.current = true;
        }
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
  const hasSyncedOnce = data.hasSyncedOnce;
  const hasConnection = Boolean(data.connection);

  return (
    <div className="space-y-6">
      <TrainingScoreGauge data={data.trainingGaugeData} />

      {!hasConnection ? (
        <Card className="border-dashed">
          <CardContent className="space-y-2 py-6">
            <p className="text-sm font-semibold text-foreground">Aucune connexion Garmin</p>
            <p className="text-sm text-muted-foreground">
              Relie ton compte via la page d’intégration pour voir tes données apparaître ici.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasConnection && !hasSyncedOnce ? (
        <Card className="border-dashed border-primary/40 bg-card/80">
          <CardContent className="space-y-2 py-6">
            <p className="text-sm font-semibold text-foreground">Première synchronisation en attente</p>
            <p className="text-sm text-muted-foreground">
              Dès que Garmin enverra tes premières données, elles apparaîtront automatiquement ici.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasConnection && hasSyncedOnce ? (
        <div className="space-y-6">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => hasSyncedOnce || Boolean(item.value));
            const hasActivities = Boolean(section.activities && section.activities.length > 0);
            if (!hasActivities && visibleItems.length === 0) {
              return null;
            }
            return (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description ? <CardDescription>{section.description}</CardDescription> : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasActivities && section.activities ? <ActivityCarousel activities={section.activities} /> : null}
                  {visibleItems.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {visibleItems.map((item) => {
                        const metricValue = renderMetricValue({ value: item.value, hasSyncedOnce });
                        return (
                          <div key={item.label} className="rounded-2xl border border-white/10 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                            <div className="mt-2">{metricValue}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default GarminDataClient;
