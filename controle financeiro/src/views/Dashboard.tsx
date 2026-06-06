import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, Banknote, CalendarClock, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getCategoryExpenseSeries,
  getFinancialInsights,
  getFixedVariableSeries,
  getMonthSummary,
  getPatrimonySeries,
  getUpcomingItems,
  getYearMonthSeries
} from "../lib/finance";
import { currency, formatDate } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

const moneyFormatter = (value: number) => currency(value).replace("R$", "R$ ");

const EmptyChart = ({ label }: { label: string }) => (
  <div className="grid h-[260px] place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
    {label}
  </div>
);

export const Dashboard = () => {
  const { currentProfile, selectedYear, selectedMonth } = useApp();
  if (!currentProfile) return null;
  const data = currentProfile.data;
  const summary = getMonthSummary(data, selectedYear, selectedMonth);
  const categorySeries = getCategoryExpenseSeries(data, selectedYear, selectedMonth);
  const monthSeries = getYearMonthSeries(data, selectedYear);
  const patrimonySeries = getPatrimonySeries(data, selectedYear);
  const fixedVariableSeries = getFixedVariableSeries(data, selectedYear, selectedMonth);
  const insights = getFinancialInsights(data, selectedYear, selectedMonth);
  const upcoming = getUpcomingItems(data, 7);
  const futureInstallments = data.loans.reduce(
    (total, loan) => total + Math.max(loan.totalInstallments - loan.paidInstallments, 0),
    0
  );

  const cards = [
    {
      label: "Receita do mês",
      value: currency(summary.income),
      icon: Banknote,
      tone: "text-emerald-500"
    },
    {
      label: "Despesas do mês",
      value: currency(summary.expenses),
      icon: Wallet,
      tone: "text-rose-500"
    },
    {
      label: "Saldo atual",
      value: currency(summary.balance),
      icon: Landmark,
      tone: summary.balance >= 0 ? "text-teal-500" : "text-rose-500"
    },
    {
      label: "Contas vencendo",
      value: String(summary.dueSoon.length),
      icon: CalendarClock,
      tone: "text-amber-500"
    },
    {
      label: "Parcelas futuras",
      value: String(futureInstallments),
      icon: AlertTriangle,
      tone: "text-slate-500"
    },
    {
      label: "Economia do mês",
      value: currency(summary.savings),
      icon: PiggyBank,
      tone: summary.savings >= 0 ? "text-emerald-500" : "text-rose-500"
    }
  ];

  return (
    <div className="grid gap-6">
      <section className="finance-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal">{card.value}</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-muted">
                  <Icon className={`h-5 w-5 ${card.tone}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pizza por categoria</CardTitle>
                <CardDescription>Distribuição das despesas do mês.</CardDescription>
              </CardHeader>
              <CardContent>
                {categorySeries.length ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categorySeries} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                          {categorySeries.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value) => moneyFormatter(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="Sem despesas para este mês." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gastos fixos x variáveis</CardTitle>
                <CardDescription>Comparação rápida do mês selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                {fixedVariableSeries.some((item) => item.value > 0) ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fixedVariableSeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                        <ChartTooltip formatter={(value) => moneyFormatter(Number(value))} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {fixedVariableSeries.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="Cadastre contas fixas, variáveis ou parcelas." />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Barras por mês</CardTitle>
                <CardDescription>Receitas, despesas e saldo no ano.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                      <ChartTooltip formatter={(value) => moneyFormatter(Number(value))} />
                      <Legend />
                      <Bar dataKey="receitas" fill="#14b8a6" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="despesas" fill="#f43f5e" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução patrimonial</CardTitle>
                <CardDescription>Saldo acumulado ao longo do ano.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={patrimonySeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                      <ChartTooltip formatter={(value) => moneyFormatter(Number(value))} />
                      <Area type="monotone" dataKey="patrimonio" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.16} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                Inteligência financeira
              </CardTitle>
              <CardDescription>Análises geradas a partir do seu histórico local.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {insights.map((insight) => (
                <div key={insight} className="rounded-lg border bg-muted/35 p-3 text-sm">
                  {insight}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos 7 dias</CardTitle>
              <CardDescription>Vencimentos e parcelas pendentes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {upcoming.length ? (
                upcoming.slice(0, 6).map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{record.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(record.dueDate)}</p>
                    </div>
                    <Badge variant={record.type === "loan" ? "warning" : "outline"}>{currency(record.amount)}</Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                  Nada vencendo nos próximos dias.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financiamentos</CardTitle>
              <CardDescription>Progresso visual das parcelas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {data.loans.length ? (
                data.loans.slice(0, 4).map((loan) => {
                  const progress = (loan.paidInstallments / loan.totalInstallments) * 100;
                  return (
                    <div key={loan.id} className="grid gap-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{loan.name}</span>
                        <span className="text-muted-foreground">
                          {loan.paidInstallments} de {loan.totalInstallments}
                        </span>
                      </div>
                      <Progress value={progress} indicatorClassName="bg-amber-500" />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                  Nenhum financiamento cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
};
