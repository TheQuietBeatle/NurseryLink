import { useEffect, useState } from "react";
import { getToiletForChild, type ToiletLog as ToiletLogType } from "../../../lib/api";

const TOILET_ICONS: Record<string, { bg: string; text: string; icon: string }> = {
  Potty: { bg: "bg-violet-50", text: "text-violet-700", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  Diaper: { bg: "bg-sky-50", text: "text-sky-700", icon: "M4 4h16v12a4 4 0 01-4 4H8a4 4 0 01-4-4V4z" },
  Training: { bg: "bg-amber-50", text: "text-amber-700", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateGroup(timestamp: string): string {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

interface ToiletLogProps {
  childId: string;
}

export function ToiletLog({ childId }: ToiletLogProps) {
  const [visits, setVisits] = useState<ToiletLogType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getToiletForChild(childId)
      .then(setVisits)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading toilet logs...</p>;
  }

  if (error) {
    return <p className="text-sm text-coral">Error: {error}</p>;
  }

  if (visits.length === 0) {
    return <p className="text-sm text-ink-soft">No toilet visits recorded yet.</p>;
  }

  // Group by date
  const grouped: { date: string; items: ToiletLogType[] }[] = [];
  for (const v of visits) {
    const dateKey = new Date(v.activity_timestamp).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.items.push(v);
    } else {
      grouped.push({ date: dateKey, items: [v] });
    }
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.date}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {formatDateGroup(group.items[0].activity_timestamp)}
          </p>
          <div className="space-y-2">
            {group.items.map((visit) => {
              const style = TOILET_ICONS[visit.toilet_type ?? "Potty"] ?? TOILET_ICONS.Potty;
              return (
                <div
                  key={visit.id}
                  className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-400" />
                  <div className="flex gap-3 p-4 pl-5">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-100 ${style.bg}`}
                    >
                      <svg className={`h-4 w-4 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                          {visit.toilet_type ?? "Potty"}
                        </span>
                        <span className="ml-2 text-xs text-ink-soft">{formatTime(visit.activity_timestamp)}</span>
                      </div>
                      {visit.comments && (
                        <p className="mt-1 text-sm text-ink-soft leading-relaxed">{visit.comments}</p>
                      )}
                      <p className="mt-1 text-xs text-ink-soft">Recorded by {visit.recorded_by}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
