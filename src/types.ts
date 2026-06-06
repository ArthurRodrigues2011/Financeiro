export type ThemeMode = "light" | "dark" | "system";

export type ViewId =
  | "dashboard"
  | "finances"
  | "annual"
  | "calendar"
  | "goals"
  | "reports"
  | "settings";

export type CategoryKind = "fixed" | "variable" | "loan" | "income";

export type RecordType = "income" | "fixed" | "variable" | "loan";

export type RecordStatus = "paid" | "pending";

export type Recurrence = "none" | "monthly";

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  isDefault?: boolean;
  createdAt: string;
};

export type FinancialRecord = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: RecordType;
  categoryId: string;
  dueDate: string;
  paidDate?: string;
  status: RecordStatus;
  recurrence: Recurrence;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type Loan = {
  id: string;
  name: string;
  lender?: string;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  firstDueDate: string;
  categoryId: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationChannel = "inApp" | "browser" | "email" | "push";

export type NotificationSettings = {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  dueTomorrow: boolean;
  dueToday: boolean;
  loanUpcoming: boolean;
  goalReached: boolean;
  spendingAboveAverage: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: "bill" | "loan" | "goal" | "spending" | "system";
  read: boolean;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  entity: "profile" | "record" | "loan" | "goal" | "category" | "backup";
  action: "created" | "updated" | "deleted" | "imported" | "exported";
  label: string;
  createdAt: string;
};

export type ProfileData = {
  categories: Category[];
  records: FinancialRecord[];
  loans: Loan[];
  goals: Goal[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  tags: string[];
  notificationSettings: NotificationSettings;
  updatedAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  passwordHash: string;
  passwordSalt: string;
  theme: ThemeMode;
  provider: "local" | "firebase-ready" | "supabase-ready";
  data: ProfileData;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSummary = Pick<
  UserProfile,
  "id" | "name" | "email" | "photo" | "theme" | "createdAt" | "updatedAt"
>;

export type NewProfileInput = {
  name: string;
  email: string;
  password: string;
  photo?: string;
};

export type ImportResult = {
  records: number;
  categories: number;
  loans: number;
};

export type ReportFilters = {
  year: number;
  month: number | "all";
  categoryId: string | "all";
  type: RecordType | "all";
  status: RecordStatus | "all";
};
