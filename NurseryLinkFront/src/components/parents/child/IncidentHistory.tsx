import { useEffect, useState } from "react";
import { getIncidentsForChild, type IncidentReport } from "../../../lib/api";

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const SEVERITY_STRIPE: Record<string, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-500",
};

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface IncidentHistoryProps {
  childId: string;
}

export function IncidentHistory({ childId }: IncidentHistoryProps) {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getIncidentsForChild(childId)
      .then(setIncidents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading incidents...</p>;
  }

  if (error) {
    return <p className="text-sm text-coral">Error: {error}</p>;
  }

  if (incidents.length === 0) {
    return <p className="text-sm text-ink-soft">No incident reports recorded.</p>;
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const severity = SEVERITY_STYLES[incident.severity_level] ?? SEVERITY_STYLES.low;
        const stripe = SEVERITY_STRIPE[incident.severity_level] ?? "bg-gray-400";

        return (
          <div
            key={incident.id}
            className={`relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripe}`} />
            <div className="p-5 pl-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Incident
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {incident.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text} ${severity.border}`}
                >
                  {incident.severity_level.charAt(0).toUpperCase() + incident.severity_level.slice(1)}
                </span>
              </div>

              <p className="text-sm text-ink-soft leading-relaxed mb-3">
                {incident.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft border-t border-[var(--color-rule)] pt-3">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Filed by {incident.teacher_name}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(incident.incident_timestamp)}
                </span>
                {incident.acknowledged_at ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Acknowledged
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
