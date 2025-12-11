"use client";

import { Locale } from "@/lib/i18n/locales";

type AdminGarminJob = {
  id: number;
  userEmail: string | null;
  status: string;
  phase: string | null;
  aiModelId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  error: string | null;
};

type AdminGarminJobsTableProps = {
  jobs: AdminGarminJob[];
  locale: Locale;
};

const formatDate = (value: string | null, locale: Locale) => {
  if (!value) {
    return "—";
  }
  try {
    const formatter = locale === "fr" ? "fr-FR" : "en-US";
    return new Intl.DateTimeFormat(formatter, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
};

const GARMIN_JOBS_COPY = {
  fr: {
    headers: ["Job", "Utilisateur", "Phase", "Statut", "Modèle IA", "Dernière maj"],
    empty: "Aucun job récent.",
  },
  en: {
    headers: ["Job", "User", "Phase", "Status", "AI model", "Last update"],
    empty: "No recent jobs.",
  },
} satisfies Record<Locale, { headers: string[]; empty: string }>;

export function AdminGarminJobsTable({ jobs, locale }: AdminGarminJobsTableProps) {
  const copy = GARMIN_JOBS_COPY[locale] ?? GARMIN_JOBS_COPY.fr;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">{copy.headers[0]}</th>
            <th className="py-2 pr-4">{copy.headers[1]}</th>
            <th className="py-2 pr-4">{copy.headers[2]}</th>
            <th className="py-2 pr-4">{copy.headers[3]}</th>
            <th className="py-2 pr-4">{copy.headers[4]}</th>
            <th className="py-2 pr-4">{copy.headers[5]}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-white/5">
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">#{job.id}</td>
              <td className="py-2 pr-4 font-mono text-xs">{job.userEmail ?? "—"}</td>
              <td className="py-2 pr-4">{job.phase ?? "—"}</td>
              <td className="py-2 pr-4">
                <span className="font-medium capitalize">{job.status}</span>
                {job.error ? (
                  <span
                    className="hidden cursor-help pl-2 text-xs text-muted-foreground sm:inline"
                    title={job.error}
                    aria-label={job.error}
                  >
                    ⓘ
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{job.aiModelId ?? "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{formatDate(job.updatedAt ?? job.createdAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 ? <p className="py-4 text-muted-foreground">{copy.empty}</p> : null}
    </div>
  );
}
