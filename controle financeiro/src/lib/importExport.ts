import type { FinancialRecord, ImportResult, ProfileData, ReportFilters, UserProfile } from "../types";
import { filterRecords, getCategory } from "./finance";
import { currency, downloadBlob, safeNumber, toISODate } from "./utils";
import { createAudit } from "./profile";

export const exportProfileJson = (profile: UserProfile) => {
  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  downloadBlob(blob, `backup-${profile.name.toLowerCase().replace(/\s+/g, "-")}.json`);
};

export const readJsonFile = (file: File) =>
  new Promise<UserProfile>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as UserProfile);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export const exportCsv = (data: ProfileData, filters: ReportFilters) => {
  const records = filterRecords(data.records, filters);
  const rows = [
    ["Nome", "Tipo", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", "Tags"],
    ...records.map((record) => [
      record.name,
      record.type,
      getCategory(data.categories, record.categoryId)?.name || "",
      String(record.amount).replace(".", ","),
      record.dueDate,
      record.paidDate || "",
      record.status,
      record.tags.join("|")
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `relatorio-${filters.year}.csv`);
};

export const exportExcel = async (data: ProfileData, filters: ReportFilters) => {
  const XLSX = await import("xlsx");
  const records = filterRecords(data.records, filters).map((record) => ({
    Nome: record.name,
    Tipo: record.type,
    Categoria: getCategory(data.categories, record.categoryId)?.name || "",
    Valor: record.amount,
    Vencimento: record.dueDate,
    Pagamento: record.paidDate || "",
    Status: record.status,
    Tags: record.tags.join(", ")
  }));
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(records);
  XLSX.utils.book_append_sheet(workbook, sheet, "Lançamentos");
  XLSX.writeFile(workbook, `relatorio-${filters.year}.xlsx`);
};

export const exportPdf = async (data: ProfileData, filters: ReportFilters) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF();
  const records = filterRecords(data.records, filters);

  doc.setFontSize(16);
  doc.text("Relatório financeiro", 14, 18);
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 26);

  autoTable(doc, {
    startY: 34,
    head: [["Nome", "Tipo", "Categoria", "Valor", "Vencimento", "Status"]],
    body: records.map((record) => [
      record.name,
      record.type,
      getCategory(data.categories, record.categoryId)?.name || "",
      currency(record.amount),
      record.dueDate,
      record.status
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] }
  });

  doc.save(`relatorio-${filters.year}.pdf`);
};

const monthColumns = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const importSpreadsheet = async (file: File, data: ProfileData): Promise<{
  data: ProfileData;
  result: ImportResult;
}> => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const currentYear = new Date().getFullYear();
  const nextData: ProfileData = JSON.parse(JSON.stringify(data));
  let records = 0;
  let categories = 0;

  rows.forEach((rawRow) => {
    const normalized = Object.entries(rawRow).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[normalizeKey(key)] = value;
      return acc;
    }, {});

    const name = String(
      normalized.conta ||
        normalized.nome ||
        normalized.descricao ||
        normalized.categoria ||
        normalized.lancamento ||
        "Lançamento importado"
    ).trim();
    const categoryName = String(normalized.categoria || normalized.tipo || name).trim();
    const typeText = String(normalized.tipo || normalized.natureza || "").toLowerCase();
    const type = typeText.includes("receita")
      ? "income"
      : typeText.includes("fix")
        ? "fixed"
        : typeText.includes("emprest") || typeText.includes("financ")
          ? "loan"
          : "variable";
    let category = nextData.categories.find(
      (item) => normalizeKey(item.name) === normalizeKey(categoryName) && item.kind === type
    );

    if (!category) {
      category = {
        id: crypto.randomUUID(),
        name: categoryName || name,
        kind: type,
        color: "#64748b",
        createdAt: new Date().toISOString()
      };
      nextData.categories.push(category);
      categories += 1;
    }

    const rowYear = Number(normalized.ano || normalized.year || currentYear);
    const explicitValue = safeNumber(normalized.valor || normalized.amount);
    const explicitDate = String(normalized.vencimento || normalized.data || normalized.due || "");

    if (explicitValue > 0) {
      const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(explicitDate)
        ? explicitDate
        : toISODate(new Date(rowYear, Number(normalized.mes || 1) - 1, Number(normalized.dia || 10)));
      nextData.records.push({
        id: crypto.randomUUID(),
        name,
        amount: explicitValue,
        type,
        categoryId: category.id,
        dueDate,
        paidDate: String(normalized.status || "").toLowerCase().includes("pago") ? dueDate : undefined,
        status: String(normalized.status || "").toLowerCase().includes("pago") ? "paid" : "pending",
        recurrence: "none",
        tags: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      records += 1;
      return;
    }

    monthColumns.forEach((monthName, index) => {
      const value = safeNumber(normalized[monthName]);
      if (!value) return;
      const dueDate = toISODate(new Date(rowYear, index, Number(normalized.dia || normalized.vencimento || 10)));
      nextData.records.push({
        id: crypto.randomUUID(),
        name,
        amount: value,
        type,
        categoryId: category.id,
        dueDate,
        status: "pending",
        recurrence: "none",
        tags: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      records += 1;
    });
  });

  nextData.auditLogs.unshift(createAudit("backup", "imported", `Planilha importada: ${file.name}`));
  nextData.updatedAt = new Date().toISOString();

  return {
    data: nextData,
    result: {
      records,
      categories,
      loans: 0
    }
  };
};
