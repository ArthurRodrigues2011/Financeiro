import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { monthNames } from "../constants";
import { useApp } from "../context/AppContext";
import { getCalendarItems, getDueState } from "../lib/finance";
import { cn, currency, parseISODate, toISODate } from "../lib/utils";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusDot = {
  paid: "bg-emerald-500",
  soon: "bg-amber-500",
  late: "bg-rose-500",
  pending: "bg-slate-400"
};

export const Calendar = () => {
  const { currentProfile, selectedYear, selectedMonth } = useApp();
  if (!currentProfile) return null;

  const first = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
  const last = endOfMonth(first);
  const calendarStart = addDays(first, -first.getDay());
  const totalDays = 42;
  const items = getCalendarItems(currentProfile.data, selectedYear, selectedMonth);
  const today = toISODate();

  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(calendarStart, index);
    const iso = toISODate(date);
    return {
      date,
      iso,
      inMonth: date >= first && date <= last,
      records: items.filter((item) => item.dueDate === iso)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-500" />
          {monthNames[selectedMonth - 1]} de {selectedYear}
        </CardTitle>
        <CardDescription>Vencimentos, pagamentos e parcelas em uma visualização mensal.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 rounded-lg border text-sm">
          {weekDays.map((day) => (
            <div key={day} className="border-b bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day.iso}
              className={cn(
                "min-h-32 border-b border-r p-2 last:border-r-0",
                !day.inMonth && "bg-muted/35 text-muted-foreground",
                day.iso === today && "bg-secondary/50"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-md text-xs font-semibold",
                    day.iso === today ? "bg-primary text-primary-foreground" : "bg-background"
                  )}
                >
                  {parseISODate(day.iso).getDate()}
                </span>
                {day.records.length ? <span className="text-xs text-muted-foreground">{day.records.length}</span> : null}
              </div>

              <div className="grid gap-1">
                {day.records.slice(0, 3).map((record) => {
                  const state = getDueState(record);
                  return (
                    <div key={record.id} className="rounded-md bg-card px-2 py-1 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", statusDot[state])} />
                        <span className="truncate text-xs font-medium">{record.name}</span>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{currency(record.amount)}</p>
                    </div>
                  );
                })}
                {day.records.length > 3 ? (
                  <span className="text-[11px] text-muted-foreground">+{day.records.length - 3} itens</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
