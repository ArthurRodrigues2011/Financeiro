import { differenceInCalendarDays } from "date-fns";
import type { NotificationItem, ProfileData } from "../types";
import { getCalendarItems, getFinancialInsights, getMonthSummary, getSpendingAverage, isExpenseType } from "./finance";
import { parseISODate, toISODate } from "./utils";

const notificationKey = (id: string) => `controle-financeiro-notified:${id}`;

const alreadySent = (id: string) => localStorage.getItem(notificationKey(id)) === toISODate();

const markSent = (id: string) => localStorage.setItem(notificationKey(id), toISODate());

const makeNotification = (
  title: string,
  body: string,
  type: NotificationItem["type"],
  idSuffix: string
): NotificationItem => ({
  id: `${toISODate()}-${idSuffix}`,
  title,
  body,
  type,
  read: false,
  createdAt: new Date().toISOString()
});

export const requestBrowserNotifications = async () => {
  if (!("Notification" in window)) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  return Notification.requestPermission();
};

export const scanNotifications = (data: ProfileData, year: number, month: number) => {
  if (!data.notificationSettings.enabled) return [];

  const settings = data.notificationSettings;
  const today = parseISODate(toISODate());
  const items: NotificationItem[] = [];

  getCalendarItems(data, year, month)
    .filter((record) => isExpenseType(record.type) && record.status !== "paid")
    .forEach((record) => {
      const diff = differenceInCalendarDays(parseISODate(record.dueDate), today);
      if (settings.dueToday && diff === 0) {
        items.push(makeNotification(`${record.name} vence hoje`, `Valor: ${record.amount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}.`, "bill", `bill-today-${record.id}`));
      }
      if (settings.dueTomorrow && diff === 1) {
        items.push(makeNotification(`${record.name} vence amanhã`, "Revise o pagamento para evitar atraso.", "bill", `bill-tomorrow-${record.id}`));
      }
      if (settings.loanUpcoming && record.type === "loan" && diff >= 0 && diff <= 2) {
        items.push(makeNotification(`Parcela próxima: ${record.name}`, record.description || "Parcela chegando.", "loan", `loan-${record.id}`));
      }
    });

  if (settings.goalReached) {
    data.goals
      .filter((goal) => goal.targetAmount > 0 && goal.currentAmount / goal.targetAmount >= 0.9)
      .forEach((goal) => {
        items.push(
          makeNotification(
            `${goal.name} chegou a ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%`,
            "Você está muito perto de concluir essa meta.",
            "goal",
            `goal-${goal.id}`
          )
        );
      });
  }

  if (settings.spendingAboveAverage) {
    const average = getSpendingAverage(data, year, month);
    const current = getMonthSummary(data, year, month).expenses;
    if (average > 0 && current > average * 1.2) {
      items.push(
        makeNotification(
          "Gastos acima da média",
          getFinancialInsights(data, year, month)[0] || "O mês atual está acima do seu padrão recente.",
          "spending",
          `spending-${year}-${month}`
        )
      );
    }
  }

  return items.filter((item) => !alreadySent(item.id));
};

export const dispatchNotifications = (items: NotificationItem[], data: ProfileData) => {
  if (!items.length) return;
  const settings = data.notificationSettings;

  if (settings.channels.browser && "Notification" in window && Notification.permission === "granted") {
    items.forEach((item) => {
      new Notification(item.title, {
        body: item.body,
        icon: "./brand-mark.svg"
      });
    });
  }

  items.forEach((item) => markSent(item.id));
};
