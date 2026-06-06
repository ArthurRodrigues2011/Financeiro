import { FileSpreadsheet, Plus } from "lucide-react";
import { RecordDialog } from "../components/forms/RecordDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { monthNames } from "../constants";
import { useApp } from "../context/AppContext";
import { getAnnualRows, getDueState } from "../lib/finance";
import { cn, currency, formatDate } from "../lib/utils";

const stateClass = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
  soon: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
  late: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
  pending: "border-border bg-card text-foreground"
};

const statusText = {
  paid: "Pago",
  soon: "Próximo",
  late: "Atrasado",
  pending: "Pendente"
};

export const AnnualTable = () => {
  const { currentProfile, selectedYear } = useApp();
  if (!currentProfile) return null;

  const rows = getAnnualRows(currentProfile.data, selectedYear);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-500" />
              Planejamento anual {selectedYear}
            </CardTitle>
            <CardDescription>Linhas por conta cadastrada e colunas de janeiro a dezembro.</CardDescription>
          </div>
          <RecordDialog>
            <Button>
              <Plus className="h-4 w-4" />
              Adicionar conta
            </Button>
          </RecordDialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b bg-card px-3 py-3 text-left text-sm font-semibold">
                    Conta
                  </th>
                  {monthNames.map((month) => (
                    <th key={month} className="border-b px-2 py-3 text-left font-semibold">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <td className="sticky left-0 z-10 w-48 border-b bg-card px-3 py-2 align-top text-sm font-medium">
                      {row.name}
                    </td>
                    {row.months.map((records, index) => (
                      <td key={`${row.name}-${index}`} className="w-40 border-b px-2 py-2 align-top">
                        {records.length ? (
                          <div className="grid gap-1">
                            {records.map((record) => {
                              const state = getDueState(record);
                              return (
                                <div key={record.id} className={cn("rounded-md border p-2", stateClass[state])}>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold">{currency(record.amount)}</span>
                                    <Badge
                                      variant={
                                        state === "paid"
                                          ? "success"
                                          : state === "soon"
                                            ? "warning"
                                            : state === "late"
                                              ? "danger"
                                              : "muted"
                                      }
                                    >
                                      {statusText[state]}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-[11px] opacity-80">Vence {formatDate(record.dueDate)}</p>
                                  {record.description ? <p className="mt-1 text-[11px] opacity-80">{record.description}</p> : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="block h-[58px] rounded-md border border-dashed bg-muted/35" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="mt-4 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Cadastre contas ou financiamentos para preencher a visão anual.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
