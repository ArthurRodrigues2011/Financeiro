import { Download, FileArchive, FileDown, FileSpreadsheet, FileText, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label, Select } from "../components/ui/input";
import { monthNames } from "../constants";
import { useApp } from "../context/AppContext";
import { filterRecords, getCategory } from "../lib/finance";
import { exportCsv, exportExcel, exportPdf, exportProfileJson, importSpreadsheet } from "../lib/importExport";
import { currency, formatDate } from "../lib/utils";
import type { RecordStatus, RecordType, ReportFilters } from "../types";

export const Reports = () => {
  const { currentProfile, selectedYear, selectedMonth, setData } = useApp();
  const [filters, setFilters] = useState<ReportFilters>({
    year: selectedYear,
    month: selectedMonth,
    categoryId: "all",
    type: "all",
    status: "all"
  });
  const [importMessage, setImportMessage] = useState("");

  const data = currentProfile?.data;
  const records = useMemo(() => (data ? filterRecords(data.records, filters) : []), [data, filters]);
  const totalIncome = records.filter((record) => record.type === "income").reduce((total, record) => total + record.amount, 0);
  const totalExpenses = records.filter((record) => record.type !== "income").reduce((total, record) => total + record.amount, 0);

  if (!currentProfile || !data) return null;

  const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) =>
    setFilters((item) => ({ ...item, [key]: value }));

  const importSheet = async (file: File | undefined) => {
    if (!file) return;
    const imported = await importSpreadsheet(file, data);
    await setData(() => imported.data);
    setImportMessage(
      `${imported.result.records} lançamentos e ${imported.result.categories} categorias importados de ${file.name}.`
    );
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Receitas filtradas</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{currency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Despesas filtradas</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600">{currency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Resultado</p>
            <p className="mt-2 text-2xl font-semibold">{currency(totalIncome - totalExpenses)}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e exportações</CardTitle>
          <CardDescription>Gere relatórios mensais, anuais ou personalizados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="grid gap-2">
              <Label>Ano</Label>
              <Input
                type="number"
                value={filters.year}
                onChange={(event) => updateFilter("year", Number(event.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Mês</Label>
              <Select value={String(filters.month)} onChange={(event) => updateFilter("month", event.target.value === "all" ? "all" : Number(event.target.value))}>
                <option value="all">Ano inteiro</option>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={filters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)}>
                <option value="all">Todas</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={filters.type} onChange={(event) => updateFilter("type", event.target.value as RecordType | "all")}>
                <option value="all">Todos</option>
                <option value="income">Receita</option>
                <option value="fixed">Fixa</option>
                <option value="variable">Variável</option>
                <option value="loan">Parcela</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Situação</Label>
              <Select value={filters.status} onChange={(event) => updateFilter("status", event.target.value as RecordStatus | "all")}>
                <option value="all">Todas</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportPdf(data, filters)}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => exportExcel(data, filters)}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => exportCsv(data, filters)}>
              <FileDown className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => exportProfileJson(currentProfile)}>
              <FileArchive className="h-4 w-4" />
              Backup JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar planilha</CardTitle>
          <CardDescription>Mapeamento automático de contas, categorias, meses, valores e status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-sm font-medium">Arquivo XLSX ou XLS</p>
                <p className="text-sm text-muted-foreground">Colunas aceitas: Conta, Categoria, Tipo, Valor, Vencimento ou Janeiro-Dezembro.</p>
              </div>
            </div>
            <Input className="sm:max-w-xs" type="file" accept=".xlsx,.xls" onChange={(event) => importSheet(event.target.files?.[0])} />
          </div>
          {importMessage ? <Badge variant="success">{importMessage}</Badge> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prévia dos dados</CardTitle>
          <CardDescription>{records.length} lançamentos encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Nome</th>
                  <th className="py-3 pr-4 font-medium">Categoria</th>
                  <th className="py-3 pr-4 font-medium">Tipo</th>
                  <th className="py-3 pr-4 font-medium">Valor</th>
                  <th className="py-3 pr-4 font-medium">Data</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((record) => (
                  <tr key={record.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{record.name}</td>
                    <td className="py-3 pr-4">{getCategory(data.categories, record.categoryId)?.name || "-"}</td>
                    <td className="py-3 pr-4 capitalize">{record.type}</td>
                    <td className="py-3 pr-4">{currency(record.amount)}</td>
                    <td className="py-3 pr-4">{formatDate(record.dueDate)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={record.status === "paid" ? "success" : "muted"}>
                        {record.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!records.length ? (
            <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento nos filtros atuais.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
