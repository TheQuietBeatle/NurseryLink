import { useEffect, useState } from "react";
import { getSuppliesForParent, type SupplyRequest } from "../../../lib/api";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending" },
  approved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Approved" },
  fulfilled: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Fulfilled" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", label: "Cancelled" },
};

const STATUS_STRIPE: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-blue-400",
  fulfilled: "bg-emerald-400",
  cancelled: "bg-gray-400",
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

interface SupplyHistoryProps {
  accountId: string;
}

export function SupplyHistory({ accountId }: SupplyHistoryProps) {
  const [supplies, setSupplies] = useState<SupplyRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSuppliesForParent(accountId)
      .then(setSupplies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading supply requests...</p>;
  }

  if (error) {
    return <p className="text-sm text-coral">Error: {error}</p>;
  }

  if (supplies.length === 0) {
    return <p className="text-sm text-ink-soft">No supply requests found.</p>;
  }

  return (
    <div className="space-y-4">
      {supplies.map((supply) => {
        const statusStyle = STATUS_STYLES[supply.status] ?? STATUS_STYLES.pending;
        const stripe = STATUS_STRIPE[supply.status] ?? "bg-gray-400";

        return (
          <div
            key={supply.id}
            className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripe}`} />
            <div className="p-5 pl-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Supply Request
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {supply.item}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {statusStyle.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Qty: {supply.quantity}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {supply.teacher_name}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(supply.requested_at)}
                </span>
              </div>

              {supply.note && (
                <p className="mt-2 text-sm text-ink-soft leading-relaxed border-t border-[var(--color-rule)] pt-2">
                  {supply.note}
                </p>
              )}

              {supply.fulfilled_at && (
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  Fulfilled on {formatDate(supply.fulfilled_at)}
                </p>
              )}

              {supply.response && (
                <p className="mt-1 text-xs text-ink-soft italic">
                  Response: {supply.response}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
