import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { LoanDialog } from "../components/forms/LoanDialog";
import { RecordDialog } from "../components/forms/RecordDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import {
  filterRecords,
  getCategory,
  getDueState,
  getLoanEndDate,
  getRecordEffectiveStatus
} from "../lib/finance";
import { cn, currency, formatDate, formatLongDate } from "../lib/utils";
import type { RecordStatus, RecordType } from "../types";
import { Select } from "../components/ui/input";

const statusLabel = {
  paid: "Pago",
  pending: "Pendente",
  soon: "Próximo",
  late: "Atrasado"
};

const statusVariant = {
  paid: "success",
  pending: "muted",
  soon: "warning",
  late: "danger"
} as const;

export const Finances = () => {
  const { currentProfile, selectedYear, selectedMonth, removeRecord, removeLoan } = useApp();
  const [typeFilter, setTypeFilter] = useState<RecordType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "all">("all");

  const data = currentProfile?.data;
  const records = useMemo(() => {
    if (!data) return [];
    return filterRecords(data.records, {
      year: selectedYear,
      month: selectedMonth,
      type: typeFilter,
      status: statusFilter
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data, selectedMonth, selectedYear, statusFilter, typeFilter]);

  if (!currentProfile || !data) return null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select className="w-44" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as RecordType | "all")}>
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="fixed">Fixas</option>
            <option value="variable">Variáveis</option>
            <option value="loan">Parcelas</option>
          </Select>
          <Select className="w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RecordStatus | "all")}>
            <option value="all">Toda situação</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <LoanDialog>
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Financiamento
            </Button>
          </LoanDialog>
          <RecordDialog>
            <Button>
              <Plus className="h-4 w-4" />
              Lançamento
            </Button>
          </RecordDialog>
        </div>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Lançamentos</TabsTrigger>
          <TabsTrigger value="loans">Financiamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Contas e receitas do mês</CardTitle>
              <CardDescription>Use filtros por tipo e situação sem perder a visão mensal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Nome</th>
                      <th className="py-3 pr-4 font-medium">Categoria</th>
                      <th className="py-3 pr-4 font-medium">Tipo</th>
                      <th className="py-3 pr-4 font-medium">Valor</th>
                      <th className="py-3 pr-4 font-medium">Vencimento</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const category = getCategory(data.categories, record.categoryId);
                      const dueState = getDueState(record);
                      return (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium">{record.name}</div>
                            {record.tags.length ? (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {record.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category?.color || "#64748b" }} />
                              {category?.name || "Sem categoria"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 capitalize">{record.type}</td>
                          <td className={cn("py-3 pr-4 font-medium", record.type === "income" ? "text-emerald-600" : "text-foreground")}>
                            {currency(record.amount)}
                          </td>
                          <td className="py-3 pr-4">{formatDate(record.dueDate)}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusVariant[dueState]}>{statusLabel[dueState]}</Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              <RecordDialog record={record}>
                                <Button variant="ghost" size="icon">
                                  <Edit3 className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                              </RecordDialog>
                              <Button variant="ghost" size="icon" onClick={() => removeRecord(record.id)}>
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!records.length ? (
                <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum lançamento encontrado para os filtros atuais.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.loans.map((loan) => {
              const progress = (loan.paidInstallments / loan.totalInstallments) * 100;
              const remaining = loan.totalInstallments - loan.paidInstallments;
              return (
                <Card key={loan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{loan.name}</CardTitle>
                        <CardDescription>{loan.lender || "Financiamento ou empréstimo"}</CardDescription>
                      </div>
                      <Badge variant={remaining ? "warning" : "success"}>{remaining ? `${remaining} restantes` : "Quitado"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {loan.paidInstallments} de {loan.totalInstallments} parcelas pagas
                        </span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} indicatorClassName="bg-amber-500" />
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-muted-foreground">Parcela</p>
                        <p className="mt-1 font-semibold">{currency(loan.installmentAmount)}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-muted-foreground">Término</p>
                        <p className="mt-1 font-semibold">{formatLongDate(getLoanEndDate(loan))}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-muted-foreground">Total restante</p>
                        <p className="mt-1 font-semibold">{currency(remaining * loan.installmentAmount)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <LoanDialog loan={loan}>
                        <Button variant="outline">
                          <Edit3 className="h-4 w-4" />
                          Editar
                        </Button>
                      </LoanDialog>
                      <Button variant="ghost" onClick={() => removeLoan(loan.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!data.loans.length ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Cadastre empréstimos, financiamentos e compras parceladas para acompanhar o progresso.
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};
