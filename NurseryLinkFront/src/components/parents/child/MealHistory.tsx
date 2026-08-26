import { useEffect, useState } from "react";
import { getMealsForChild, type MealLog } from "../../../lib/api";

const MEAL_ICONS: Record<string, string> = {
  Breakfast: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  Lunch: "M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.5 1.5 0 003 15.546M12 2v3m0 0a3 3 0 100 6 3 3 0 000-6z",
  Snack: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const PORTION_STYLES: Record<string, { bg: string; text: string }> = {
  Full: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Half: { bg: "bg-amber-50", text: "text-amber-700" },
  Small: { bg: "bg-orange-50", text: "text-orange-700" },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface MealHistoryProps {
  childId: string;
}

export function MealHistory({ childId }: MealHistoryProps) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMealsForChild(childId)
      .then(setMeals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading meals...</p>;
  }

  if (error) {
    return <p className="text-sm text-coral">Error: {error}</p>;
  }

  if (meals.length === 0) {
    return <p className="text-sm text-ink-soft">No meal records found.</p>;
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const mealType = meal.meal_type ?? "Meal";
        const portion = meal.food_portion ?? null;
        const portionStyle = portion ? PORTION_STYLES[portion] ?? PORTION_STYLES.Full : null;

        return (
          <div
            key={meal.id}
            className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-400" />
            <div className="flex gap-3 p-4 pl-5">
              <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 border border-teal-100">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={MEAL_ICONS[mealType] ?? MEAL_ICONS.Snack}
                  />
                </svg>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-semibold text-ink">{mealType}</h3>
                  <span className="text-xs text-ink-soft shrink-0 ml-2">
                    {formatTime(meal.activity_timestamp)}
                  </span>
                </div>
                {meal.comments && (
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {meal.comments}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {portionStyle && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${portionStyle.bg} ${portionStyle.text}`}
                    >
                      {portion}
                    </span>
                  )}
                  <span className="text-xs text-ink-soft">
                    by {meal.teacher_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
