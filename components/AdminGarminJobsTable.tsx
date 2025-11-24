"use client";

type AdminGarminJob = {
  id: number;
  userEmail: string | null;
  status: string;
  phase: string | null;
  aiModelId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminGarminJobsTableProps = {
  jobs: AdminGarminJob[];
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
};

export function AdminGarminJobsTable({ jobs }: AdminGarminJobsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">Job</th>
            <th className="py-2 pr-4">Utilisateur</th>
            <th className="py-2 pr-4">Phase</th>
            <th className="py-2 pr-4">Statut</th>
            <th className="py-2 pr-4">Modèle IA</th>
            <th className="py-2 pr-4">Dernière maj</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-white/5">
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">#{job.id}</td>
              <td className="py-2 pr-4 font-mono text-xs">{job.userEmail ?? "—"}</td>
              <td className="py-2 pr-4">{job.phase ?? "—"}</td>
              <td className="py-2 pr-4">{job.status}</td>
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{job.aiModelId ?? "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{formatDate(job.updatedAt ?? job.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 ? <p className="py-4 text-muted-foreground">Aucun job récent.</p> : null}
    </div>
  );
}

