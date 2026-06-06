import { addMonths, differenceInCalendarDays, endOfMonth, isAfter, isBefore, startOfMonth } from "date-fns";
import { monthNames, shortMonthNames } from "../constants";
import type {
  Category,
  FinancialRecord,
  Goal,
  Loan,
  ProfileData,
  RecordStatus,
  RecordType,
  ReportFilters
} from "../types";
import { currency, parseISODate, toISODate, yearFromISO } from "./utils";

export const isExpenseType = (type: RecordType) =>
  type === "fixed" || type === "variable" || type === "loan";

export const getCategory = (categories: Category[], id: string) =>
  categories.find((category) => category.id === id);

export const getRecordEffectiveStatus = (record: FinancialRecord): RecordStatus =>
  record.paidDate || record.status === "paid" ? "paid" : "pending";

export const isRecordInMonth = (record: FinancialRecord, year: number, month: number) => {
  const due = parseISODate(record.dueDate);
  return due.getFullYear() === year && due.getMonth() + 1 === month;
};

export const filterRecords = (
  records: FinancialRecord[],
  filters: Partial<ReportFilters>
) =>
  records.filter((record) => {
    const due = parseISODate(record.dueDate);
    if (filters.year && due.getFullYear() !== filters.year) return false;
    if (filters.month && filters.month !== "all" && due.getMonth() + 1 !== filters.month) return false;
    if (filters.categoryId && filters.categoryId !== "all" && record.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.type && filters.type !== "all" && record.type !== filters.type) return false;
    if (filters.status && filters.status !== "all" && getRecordEffectiveStatus(record) !== filters.status) {
      return false;
    }
    return true;
  });

export const sumRecords = (records: FinancialRecord[], predicate: (record: FinancialRecord) => boolean) =>
  records.reduce((total, record) => (predicate(record) ? total + record.amount : total), 0);

export const getMonthSummary = (data: ProfileData, year: number, month: number) => {
  const monthly = filterRecords(data.records, { year, month });
  const income = sumRecords(monthly, (record) => record.type === "income");
  const expenses = sumRecords(monthly, (record) => isExpenseType(record.type));
  const paidIncome = sumRecords(monthly, (record) => record.type === "income" && getRecordEffectiveStatus(record) === "paid");
  const paidExpenses = sumRecords(
    monthly,
    (record) => isExpenseType(record.type) && getRecordEffectiveStatus(record) === "paid"
  );
  const pendingExpenses = sumRecords(
    monthly,
    (record) => isExpenseType(record.type) && getRecordEffectiveStatus(record) === "pending"
  );
  const today = parseISODate(toISODate());
  const dueSoon = monthly.filter((record) => {
    if (!isExpenseType(record.type) || getRecordEffectiveStatus(record) === "paid") return false;
    const due = parseISODate(record.dueDate);
    const diff = differenceInCalendarDays(due, today);
    return diff >= 0 && diff <= 7;
  });

  return {
    income,
    expenses,
    paidIncome,
    paidExpenses,
    pendingExpenses,
    savings: paidIncome - paidExpenses,
    balance: paidIncome - paidExpenses,
    dueSoon
  };
};

export const getYearMonthSeries = (data: ProfileData, year: number) =>
  shortMonthNames.map((month, index) => {
    const monthNumber = index + 1;
    const summary = getMonthSummary(data, year, monthNumber);

    return {
      month,
      monthNumber,
      receitas: summary.income,
      despesas: summary.expenses,
      saldo: summary.income - summary.expenses
    };
  });

export const getCategoryExpenseSeries = (data: ProfileData, year: number, month: number) => {
  const monthly = filterRecords(data.records, { year, month }).filter((record) => isExpenseType(record.type));
  const grouped = new Map<string, number>();

  monthly.forEach((record) => {
    grouped.set(record.categoryId, (grouped.get(record.categoryId) || 0) + record.amount);
  });

  return [...grouped.entries()]
    .map(([categoryId, value]) => {
      const category = getCategory(data.categories, categoryId);
      return {
        name: category?.name || "Sem categoria",
        value,
        fill: category?.color || "#64748b"
      };
    })
    .sort((a, b) => b.value - a.value);
};

export const getFixedVariableSeries = (data: ProfileData, year: number, month: number) => {
  const monthly = filterRecords(data.records, { year, month });
  return [
    {
      name: "Fixas",
      value: sumRecords(monthly, (record) => record.type === "fixed"),
      fill: "#14b8a6"
    },
    {
      name: "Variáveis",
      value: sumRecords(monthly, (record) => record.type === "variable"),
      fill: "#f59e0b"
    },
    {
      name: "Parcelas",
      value: sumRecords(monthly, (record) => record.type === "loan"),
      fill: "#f43f5e"
    }
  ];
};

export const getPatrimonySeries = (data: ProfileData, year: number) => {
  let cumulative = 0;
  return getYearMonthSeries(data, year).map((item) => {
    cumulative += item.saldo;
    return {
      month: item.month,
      patrimonio: cumulative
    };
  });
};

export const getLoanEndDate = (loan: Loan) =>
  toISODate(addMonths(parseISODate(loan.firstDueDate), Math.max(loan.totalInstallments - 1, 0)));

export const getLoanInstallmentsForYear = (loan: Loan, year: number): FinancialRecord[] => {
  const createdAt = loan.createdAt || new Date().toISOString();

  return Array.from({ length: loan.totalInstallments }, (_, index) => {
    const dueDate = toISODate(addMonths(parseISODate(loan.firstDueDate), index));
    const status: RecordStatus = index + 1 <= loan.paidInstallments ? "paid" : "pending";

    return {
      id: `${loan.id}-${index + 1}`,
      name: loan.name,
      description: `${index + 1} de ${loan.totalInstallments} parcelas`,
      amount: loan.installmentAmount,
      type: "loan",
      categoryId: loan.categoryId,
      dueDate,
      paidDate: status === "paid" ? dueDate : undefined,
      status,
      recurrence: "none",
      tags: loan.tags,
      attachments: [],
      createdAt,
      updatedAt: loan.updatedAt
    };
  }).filter((record) => yearFromISO(record.dueDate) === year);
};

export const getAnnualRows = (data: ProfileData, year: number) => {
  const records = data.records.filter((record) => yearFromISO(record.dueDate) === year && record.type !== "income");
  const loanRecords = data.loans.flatMap((loan) => getLoanInstallmentsForYear(loan, year));
  const all = [...records, ...loanRecords];
  const names = [...new Set(all.map((record) => record.name))].sort((a, b) => a.localeCompare(b));

  return names.map((name) => ({
    name,
    months: monthNames.map((_, index) => {
      const month = index + 1;
      const monthRecords = all
        .filter((record) => record.name === name && isRecordInMonth(record, year, month))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return monthRecords;
    })
  }));
};

export const getDueState = (record: FinancialRecord) => {
  if (getRecordEffectiveStatus(record) === "paid") return "paid";
  const today = parseISODate(toISODate());
  const due = parseISODate(record.dueDate);
  if (isBefore(due, today)) return "late";
  if (differenceInCalendarDays(due, today) <= 5) return "soon";
  return "pending";
};

export const getCalendarItems = (data: ProfileData, year: number, month: number) => {
  const records = filterRecords(data.records, { year, month });
  const loanRecords = data.loans.flatMap((loan) => getLoanInstallmentsForYear(loan, year)).filter((record) =>
    isRecordInMonth(record, year, month)
  );

  return [...records, ...loanRecords].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getFinancialInsights = (data: ProfileData, year: number, month: number) => {
  const summary = getMonthSummary(data, year, month);
  const previousDate = addMonths(new Date(year, month - 1, 1), -1);
  const previousSummary = getMonthSummary(data, previousDate.getFullYear(), previousDate.getMonth() + 1);
  const insights: string[] = [];

  if (previousSummary.expenses > 0) {
    const diff = summary.expenses - previousSummary.expenses;
    const variation = diff / previousSummary.expenses;
    if (Math.abs(variation) >= 0.08) {
      insights.push(
        `Suas despesas ${variation > 0 ? "aumentaram" : "caíram"} ${Math.abs(variation * 100).toFixed(0)}% em relação ao mês anterior.`
      );
    }
  }

  if (summary.savings > 0) {
    insights.push(`Você economizou ${currency(summary.savings)} este mês.`);
  } else if (summary.income > 0 && summary.savings < 0) {
    insights.push(`O mês está negativo em ${currency(Math.abs(summary.savings))}. Vale revisar gastos variáveis.`);
  }

  const cardCategory = data.categories.find((category) => category.name.toLowerCase().includes("cartão"));
  if (cardCategory) {
    const currentCard = sumRecords(
      filterRecords(data.records, { year, month }),
      (record) => record.categoryId === cardCategory.id
    );
    const previousCard = sumRecords(
      filterRecords(data.records, {
        year: previousDate.getFullYear(),
        month: previousDate.getMonth() + 1
      }),
      (record) => record.categoryId === cardCategory.id
    );
    if (previousCard > 0 && currentCard > previousCard) {
      const delta = ((currentCard - previousCard) / previousCard) * 100;
      insights.push(`Seu gasto com cartão aumentou ${delta.toFixed(0)}%.`);
    }
  }

  data.loans
    .filter((loan) => loan.paidInstallments < loan.totalInstallments)
    .slice(0, 2)
    .forEach((loan) => {
      const endDate = new Date(`${getLoanEndDate(loan)}T00:00:00`);
      insights.push(
        `${loan.name} terminará em ${endDate.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric"
        })}.`
      );
    });

  data.goals
    .filter((goal) => goal.targetAmount > 0)
    .filter((goal) => goal.currentAmount / goal.targetAmount >= 0.9)
    .slice(0, 2)
    .forEach((goal) => {
      insights.push(`${goal.name} atingiu ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}% da meta.`);
    });

  if (!insights.length) {
    insights.push("Cadastre receitas, contas e metas para receber análises automáticas mais precisas.");
  }

  return insights;
};

export const getSpendingAverage = (data: ProfileData, year: number, month: number) => {
  const currentMonthStart = startOfMonth(new Date(year, month - 1, 1));
  const previousMonths = Array.from({ length: 3 }, (_, index) => addMonths(currentMonthStart, -(index + 1)));
  const totals = previousMonths.map((date) => getMonthSummary(data, date.getFullYear(), date.getMonth() + 1).expenses);
  const valid = totals.filter((value) => value > 0);
  if (!valid.length) return 0;
  return valid.reduce((total, value) => total + value, 0) / valid.length;
};

export const getUpcomingItems = (data: ProfileData, days = 7) => {
  const today = parseISODate(toISODate());
  const limit = endOfMonth(addMonths(today, 1));
  const records = data.records.filter((record) => {
    if (!isExpenseType(record.type) || getRecordEffectiveStatus(record) === "paid") return false;
    const due = parseISODate(record.dueDate);
    return !isBefore(due, today) && differenceInCalendarDays(due, today) <= days;
  });

  const loanRecords = data.loans
    .flatMap((loan) => {
      const remainingIndex = loan.paidInstallments;
      if (remainingIndex >= loan.totalInstallments) return [];
      const dueDate = toISODate(addMonths(parseISODate(loan.firstDueDate), remainingIndex));
      const due = parseISODate(dueDate);
      if (isAfter(due, limit)) return [];
      return getLoanInstallmentsForYear(loan, due.getFullYear()).filter((record) => record.dueDate === dueDate);
    })
    .filter((record) => differenceInCalendarDays(parseISODate(record.dueDate), today) <= days);

  return [...records, ...loanRecords].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const buildRecordSearchText = (record: FinancialRecord, categories: Category[]) => {
  const category = getCategory(categories, record.categoryId)?.name || "";
  return [record.name, record.description, category, record.type, record.status, record.tags.join(" ")].join(" ");
};

export const goalProgress = (goal: Goal) =>
  goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
