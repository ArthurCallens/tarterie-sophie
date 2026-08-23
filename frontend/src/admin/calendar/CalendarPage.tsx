import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OrderCard } from "../orders/OrderCard";
import { useOrders } from "../orders/useOrders";
import type { Order } from "../../lib/supabase/types";

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

function groupByPickupDate(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const list = map.get(order.pickup_date) ?? [];
    list.push(order);
    map.set(order.pickup_date, list);
  }
  return map;
}

export function CalendarPage() {
  const { accepted, pending, invoicesByOrderId, loading, error } = useOrders();
  const [searchParams] = useSearchParams();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Deep link from a pending order's "Bekijk in kalender" link — jump
  // straight to that order's pickup date, in the right month, pre-selected.
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return;
    const parsed = new Date(`${dateParam}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setSelectedDateKey(dateParam);
    // Only react to the param changing (e.g. a new link click), not to
    // Sophie's own subsequent month navigation/day clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("date")]);

  const ordersByDate = useMemo(() => groupByPickupDate(accepted), [accepted]);
  const pendingByDate = useMemo(() => groupByPickupDate(pending), [pending]);

  const grid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const selectedOrders = selectedDateKey ? (ordersByDate.get(selectedDateKey) ?? []) : [];
  const selectedPending = selectedDateKey ? (pendingByDate.get(selectedDateKey) ?? []) : [];

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
              const dayPending = pendingByDate.get(key) ?? [];
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDateKey === key;
              const hasAnything = dayOrders.length > 0 || dayPending.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDateKey(hasAnything ? key : null)}
                  className={`flex min-h-16 flex-col items-start gap-1 rounded-xl border p-2 text-left text-xs ${
                    isSelected ? "border-cherry bg-cherry/10" : "border-cacao/10 bg-cream-dark"
                  } ${inMonth ? "text-cacao" : "text-cacao-soft/40"}`}
                >
                  <span>{day.getDate()}</span>
                  {dayOrders.length > 0 && (
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-cream">
                      {dayOrders.length} bestelling{dayOrders.length > 1 ? "en" : ""}
                    </span>
                  )}
                  {dayPending.length > 0 && (
                    <span className="rounded-full bg-cherry px-2 py-0.5 text-[10px] font-semibold text-cream">
                      {dayPending.length} wachtend
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <div className="mt-6 space-y-6">
              {selectedPending.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-cacao">Wachtend op {selectedDateKey}</h2>
                  <p className="mt-1 text-xs text-cacao-soft">
                    Nog niet geaccepteerd — klik om terug te gaan naar de bestellingenlijst.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {selectedPending.map((order) => (
                      <Link
                        key={order.id}
                        to={`/admin/orders?focus=${order.id}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-cherry/40 bg-cherry/10 px-4 py-2.5 text-sm text-cacao hover:border-cherry"
                      >
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="text-xs text-cacao-soft">
                          {order.occasion} · {order.servings} pers.
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-display text-lg text-cacao">Geaccepteerd op {selectedDateKey}</h2>
                {selectedOrders.length === 0 ? (
                  <p className="mt-3 text-sm text-cacao-soft">Geen geaccepteerde bestellingen op deze dag.</p>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {selectedOrders.map((order) => (
                      <OrderCard key={order.id} order={order} invoice={invoicesByOrderId.get(order.id)} readOnly />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
