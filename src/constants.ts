import type { Category, NotificationSettings, ViewId } from "./types";

export const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
] as const;

export const shortMonthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez"
] as const;

export const categoryPalette = [
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#6366f1",
  "#22c55e",
  "#0ea5e9",
  "#a855f7",
  "#ef4444",
  "#84cc16",
  "#64748b"
];

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  channels: {
    inApp: true,
    browser: false,
    email: false,
    push: false
  },
  dueTomorrow: true,
  dueToday: true,
  loanUpcoming: true,
  goalReached: true,
  spendingAboveAverage: true
};

const now = () => new Date().toISOString();

export const createDefaultCategories = (): Category[] => {
  const fixed = [
    "Luz",
    "Água",
    "Internet",
    "Academia",
    "Aluguel",
    "Condomínio",
    "Telefone"
  ];
  const variable = [
    "Cartão de crédito",
    "Mercado",
    "Lazer",
    "Transporte",
    "Saúde",
    "Compras"
  ];
  const income = ["Salário", "Freelance", "Investimentos"];

  return [
    ...income.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      kind: "income" as const,
      color: categoryPalette[index % categoryPalette.length],
      isDefault: true,
      createdAt: now()
    })),
    ...fixed.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      kind: "fixed" as const,
      color: categoryPalette[(index + 3) % categoryPalette.length],
      isDefault: true,
      createdAt: now()
    })),
    ...variable.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      kind: "variable" as const,
      color: categoryPalette[(index + 6) % categoryPalette.length],
      isDefault: true,
      createdAt: now()
    })),
    {
      id: crypto.randomUUID(),
      name: "Financiamentos e empréstimos",
      kind: "loan",
      color: "#64748b",
      isDefault: true,
      createdAt: now()
    }
  ];
};

export const navigationItems: Array<{
  id: ViewId;
  label: string;
  description: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Resumo mensal e inteligência financeira"
  },
  {
    id: "finances",
    label: "Finanças",
    description: "Contas, receitas, despesas e empréstimos"
  },
  {
    id: "annual",
    label: "Tabela anual",
    description: "Visão estilo planilha de janeiro a dezembro"
  },
  {
    id: "calendar",
    label: "Calendário",
    description: "Vencimentos, pagamentos e parcelas"
  },
  {
    id: "goals",
    label: "Metas",
    description: "Objetivos financeiros e progresso"
  },
  {
    id: "reports",
    label: "Relatórios",
    description: "Exportações PDF, Excel, CSV e filtros"
  },
  {
    id: "settings",
    label: "Configurações",
    description: "Perfil, backup, notificações e preferências"
  }
];
