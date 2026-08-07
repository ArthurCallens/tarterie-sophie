import { useMemo, useState } from "react";
import { OrderCard } from "../orders/OrderCard";
import { useOrders } from "../orders/useOrders";

const MONTH_LABEL = new Intl.DateTimeFormat("nl-BE", { month: "long", year: "numeric" });
const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Monday-first grid of every day cell needed to fill the calendar month view. */
function buildMonthGrid(visibleMonth: Date): Date[] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

export function CalendarPage() {
  const { accepted, invoicesByOrderId, loading, error } = useOrders();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const ordersByDate = useMemo(() => {
    const map = new Map<string, typeof accepted>();
    for (const order of accepted) {
      const list = map.get(order.pickup_date) ?? [];
      list.push(order);
      map.set(order.pickup_date, list);
    }
    return map;
  }, [accepted]);

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const selectedOrders = selectedDateKey ? (ordersByDate.get(selectedDateKey) ?? []) : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-cacao">Kalender</h1>

      {error && <p className="mt-4 text-sm text-cherry">{error}</p>}
      {loading && <p className="mt-6 text-sm text-cacao-soft">Bezig met laden…</p>}

      {!loading && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-full bg-cacao/10 px-4 py-1.5 text-sm font-semibold text-cacao-soft hover:bg-cacao/20"
            >
              ← Vorige
            </button>
            <p className="font-display text-lg capitalize text-cacao">{MONTH_LABEL.format(visibleMonth)}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-full bg-cacao/10 px-4 py-1.5 text-sm font-semibold text-cacao-soft hover:bg-cacao/20"
            >
              Volgende →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-cacao-soft">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((day) => {
              const key = toDateKey(day);
              const dayOrders = ordersByDate.get(key) ?? [];
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDateKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDateKey(dayOrders.length > 0 ? key : null)}
                  className={`flex min-h-16 flex-col items-start rounded-xl border p-2 text-left text-xs ${
                    isSelected ? "border-cherry bg-cherry/10" : "border-cacao/10 bg-cream-dark"
                  } ${inMonth ? "text-cacao" : "text-cacao-soft/40"}`}
                >
                  <span>{day.getDate()}</span>
                  {dayOrders.length > 0 && (
                    <span className="mt-1 rounded-full bg-cherry px-2 py-0.5 text-[10px] font-semibold text-cream">
                      {dayOrders.length} bestelling{dayOrders.length > 1 ? "en" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <div className="mt-6">
              <h2 className="font-display text-lg text-cacao">Bestellingen op {selectedDateKey}</h2>
              {selectedOrders.length === 0 ? (
                <p className="mt-3 text-sm text-cacao-soft">Geen bestellingen meer op deze dag.</p>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {selectedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} invoice={invoicesByOrderId.get(order.id)} readOnly />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
