import { useEffect, useState } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Line } from "react-chartjs-2";

import "./Temp.css";

interface TemperatureLog {
  id: number;
  child_id: number;
  log_type: string;
  activity_timestamp: string;
  degree_celsius?: number;
  comments?: string;
}

type TempStatus = {
  label: string;
  className: string;
};

function getTempStatus(degreeCelsius?: number): TempStatus {
  if (degreeCelsius === undefined || degreeCelsius === null) {
    return { label: "No readings yet", className: "temp-status-unknown" };
  }
  if (degreeCelsius > 38.5) {
    return { label: "High Fever", className: "temp-status-high-fever" };
  }
  if (degreeCelsius > 38.0) {
    return { label: "Fever", className: "temp-status-fever" };
  }
  if (degreeCelsius > 37.5) {
    return { label: "Elevated", className: "temp-status-elevated" };
  }
  return { label: "Normal", className: "temp-status-normal" };
}

async function getTemperatureHistory(childId: string): Promise<TemperatureLog[]> {
  const res = await fetch(`http://localhost:3000/temperature/${childId} `);
  if (!res.ok) throw new Error("Failed to fetch temperature history");
  return res.json();
}

async function addTemperatureLog(
  childId: string,
  accountId: string,
  degreeCelsius: number,
  comments: string,
): Promise<TemperatureLog> {
  const res = await fetch(`http://localhost:3000/temperature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      child_id: childId,
      degree_celsius: degreeCelsius,
      comments: comments || undefined,
    }),
  });
  if (!res.ok) throw new Error("Failed to add temperature reading");
  return res.json();
}

function formatLogDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readStoredAccountId(): string | null {
  try {
    const raw = localStorage.getItem("account");
    if (!raw) return null;
    return (JSON.parse(raw) as { id: string }).id ?? null;
  } catch {
    return null;
  }
}

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
//defaults.plugins.title.fontsize = 20;
defaults.plugins.title.color = "black";

export const Temperature = ({ childId }: { childId: string }) => {
  const [history, setHistory] = useState<TemperatureLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [degrees, setDegrees] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadHistory = () => {
    getTemperatureHistory(childId)
      .then(setHistory)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const handleAddTemp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const degreeCelsius = parseFloat(degrees);
    if (Number.isNaN(degreeCelsius)) {
      setFormError("Please enter a valid temperature.");
      return;
    }

    const accountId = readStoredAccountId();
    if (!accountId) {
      setFormError("You must be signed in to add a reading.");
      return;
    }

    setSubmitting(true);
    try {
      await addTemperatureLog(childId, accountId, degreeCelsius, comments);
      setDegrees("");
      setComments("");
      loadHistory();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p>Error: {error}</p>;

  const latest = history[0];
  const status = getTempStatus(latest?.degree_celsius);

  return (
    <div className="temp-card">
      <div className={`temp-status-badge ${status.className}`}>
        {status.label}
        {latest?.degree_celsius !== undefined && ` (${latest.degree_celsius}°C)`}
      </div>

      <form className="temp-add-form" onSubmit={handleAddTemp}>
        <input
          type="number"
          step="0.1"
          placeholder="Temperature (°C)"
          value={degrees}
          onChange={(e) => setDegrees(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Comments (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Reading"}
        </button>
      </form>
      {formError && <p className="temp-form-error">{formError}</p>}

      {history.length > 0 && (
        <div className="temp-chart">
          <Line
            data={{
              // your endpoint returns newest-first; reverse so the chart reads left→right in time
              labels: [...history]
                .reverse()
                .map((log) => formatLogDate(log.activity_timestamp)),
              datasets: [
                {
                  label: "Temperature (°C)",
                  data: [...history].reverse().map((log) => log.degree_celsius),
                  backgroundColor: "#064FF0",
                  borderColor: "#064FF0",
                },
              ],
            }}
            options={{
              elements: { line: { tension: 0.5 } },
              plugins: { title: { text: "Temperature History" } },
            }}
          />
        </div>
      )}
    </div>
  );
};
