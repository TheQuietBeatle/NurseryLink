import { useEffect, useState } from "react";
import { getAttendanceForChild, type AttendanceRecord } from "../../../lib/api";

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function calculateDuration(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return "Still present";
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface AttendanceLogProps {
  childId: string;
}

export function AttendanceLog({ childId }: AttendanceLogProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAttendanceForChild(childId)
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading attendance records...</p>;
  }

  if (error) {
    return <p className="text-sm text-coral">Error: {error}</p>;
  }

  if (records.length === 0) {
    return <p className="text-sm text-ink-soft">No attendance records found.</p>;
  }

  // Stats
  const totalDays = records.length;
  const daysPresent = records.filter((r) => r.status || r.check_out_time).length;
  const avgDuration = records
    .filter((r) => r.check_out_time)
    .reduce((acc, r) => {
      const ms = new Date(r.check_out_time!).getTime() - new Date(r.check_in_time).getTime();
      return acc + ms;
    }, 0) / (records.filter((r) => r.check_out_time).length || 1);

  const avgHours = Math.floor(avgDuration / (1000 * 60 * 60));
  const avgMinutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 text-center shadow-[var(--shadow-card)]">
          <p className="text-2xl font-bold text-teal-800">{totalDays}</p>
          <p className="mt-1 text-xs text-ink-soft">Total Days</p>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 text-center shadow-[var(--shadow-card)]">
          <p className="text-2xl font-bold text-emerald-700">{daysPresent}</p>
          <p className="mt-1 text-xs text-ink-soft">Days Present</p>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 text-center shadow-[var(--shadow-card)]">
          <p className="text-2xl font-bold text-violet-700">
            {avgHours}h {avgMinutes}m
          </p>
          <p className="mt-1 text-xs text-ink-soft">Avg. Duration</p>
        </div>
      </div>

      {/* Attendance list */}
      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${
                record.status ? "bg-emerald-400" : record.check_out_time ? "bg-teal-400" : "bg-amber-400"
              }`}
            />
            <div className="flex items-center gap-3 p-4 pl-5">
              {/* Status icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  record.status
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                    : "border-amber-100 bg-amber-50 text-amber-600"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      record.status
                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    }
                  />
                </svg>
              </div>

              {/* Details */}
              <div className="min-w-0 flex-grow">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-ink">{formatDate(record.check_in_time)}</p>
                  <span
                    className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      record.status
                        ? "bg-emerald-50 text-emerald-700"
                        : record.check_out_time
                        ? "bg-teal-50 text-teal-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {record.status ? "Present" : record.check_out_time ? "Completed" : "Checked In"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    In: {formatTime(record.check_in_time)}
                  </span>
                  {record.check_out_time && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Out: {formatTime(record.check_out_time)}
                    </span>
                  )}
                  <span className="font-medium text-ink">
                    {calculateDuration(record.check_in_time, record.check_out_time)}
                  </span>
                </div>
                {record.reason && (
                  <p className="mt-1 text-xs text-ink-soft italic">{record.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
