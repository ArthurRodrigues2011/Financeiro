import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Flag,
  Gauge,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Table2,
  WalletCards,
  X
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { monthNames, navigationItems } from "../../constants";
import { useApp } from "../../context/AppContext";
import { buildRecordSearchText } from "../../lib/finance";
import { exportProfileJson } from "../../lib/importExport";
import { cn, currency, formatDate, normalizeText } from "../../lib/utils";
import type { ViewId } from "../../types";
import { RecordDialog } from "../forms/RecordDialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input, Select } from "../ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const iconMap: Record<ViewId, typeof Gauge> = {
  dashboard: Gauge,
  finances: WalletCards,
  annual: Table2,
  calendar: CalendarDays,
  goals: Flag,
  reports: FileSpreadsheet,
  settings: Settings
};

const years = Array.from({ length: 9 }, (_, index) => new Date().getFullYear() - 4 + index);

const ThemeButton = () => {
  const { currentProfile, updateProfile } = useApp();
  const mode = currentProfile?.theme || "system";
  const nextMode = mode === "dark" ? "light" : "dark";
  const Icon = mode === "dark" ? Sun : Moon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => updateProfile({ theme: nextMode })}>
          <Icon className="h-4 w-4" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Alternar tema</TooltipContent>
    </Tooltip>
  );
};

const NotificationsDialog = () => {
  const { currentProfile, markNotificationRead, clearNotifications } = useApp();
  const notifications = currentProfile?.data.notifications || [];
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unread ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              ) : null}
              <span className="sr-only">Notificações</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Notificações</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notificações</DialogTitle>
          <DialogDescription>Alertas locais de vencimento, metas e gastos.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
          {notifications.length ? (
            notifications.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "rounded-lg border p-3 text-left transition hover:bg-muted",
                  item.read ? "bg-card" : "bg-secondary/45"
                )}
                onClick={() => markNotificationRead(item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                  <Badge variant={item.read ? "muted" : "secondary"}>{item.type}</Badge>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação por enquanto.
            </div>
          )}
        </div>
        {notifications.length ? (
          <Button variant="outline" onClick={clearNotifications}>
            Limpar notificações
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const GlobalSearch = () => {
  const { currentProfile, searchQuery, setSearchQuery, setActiveView } = useApp();
  const data = currentProfile?.data;
  const query = normalizeText(searchQuery);

  const results = useMemo(() => {
    if (!data || query.length < 2) return [];
    const records = data.records
      .filter((record) => normalizeText(buildRecordSearchText(record, data.categories)).includes(query))
      .slice(0, 5)
      .map((record) => ({
        id: record.id,
        label: record.name,
        detail: `${currency(record.amount)} · ${formatDate(record.dueDate)}`,
        view: "finances" as ViewId
      }));
    const goals = data.goals
      .filter((goal) => normalizeText(goal.name).includes(query))
      .slice(0, 3)
      .map((goal) => ({
        id: goal.id,
        label: goal.name,
        detail: `${currency(goal.currentAmount)} de ${currency(goal.targetAmount)}`,
        view: "goals" as ViewId
      }));
    const loans = data.loans
      .filter((loan) => normalizeText(loan.name).includes(query))
      .slice(0, 3)
      .map((loan) => ({
        id: loan.id,
        label: loan.name,
        detail: `${loan.paidInstallments} de ${loan.totalInstallments} parcelas`,
        view: "finances" as ViewId
      }));
    return [...records, ...goals, ...loans].slice(0, 8);
  }, [data, query]);

  if (!results.length || query.length < 2) return null;

  return (
    <div className="absolute left-0 right-0 top-12 z-30 rounded-lg border bg-card p-2 shadow-soft">
      {results.map((result) => (
        <button
          key={`${result.view}-${result.id}`}
          className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          onClick={() => {
            setActiveView(result.view);
            setSearchQuery("");
          }}
        >
          <span className="font-medium">{result.label}</span>
          <span className="truncate text-muted-foreground">{result.detail}</span>
        </button>
      ))}
    </div>
  );
};

export const AppShell = ({ children }: { children: ReactNode }) => {
  const {
    currentProfile,
    activeView,
    selectedYear,
    selectedMonth,
    searchQuery,
    isSidebarCollapsed,
    setActiveView,
    setSelectedYear,
    setSelectedMonth,
    setSearchQuery,
    setIsSidebarCollapsed,
    logout
  } = useApp();

  if (!currentProfile) return null;

  return (
    <TooltipProvider delayDuration={180}>
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden border-r bg-card transition-all duration-200 lg:flex lg:flex-col",
            isSidebarCollapsed ? "w-[76px]" : "w-[268px]"
          )}
        >
          <div className="flex h-16 items-center gap-3 border-b px-4">
            <img src="./brand-mark.svg" alt="" className="h-9 w-9 rounded-lg" />
            {!isSidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Controle Financeiro</p>
                <p className="truncate text-xs text-muted-foreground">{currentProfile.name}</p>
              </div>
            ) : null}
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navigationItems.map((item) => {
              const Icon = iconMap[item.id];
              const active = activeView === item.id;
              const button = (
                <button
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
                </button>
              );

              return isSidebarCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.id}>{button}</div>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <Button
              variant="ghost"
              className={cn("w-full", isSidebarCollapsed ? "px-0" : "justify-start")}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!isSidebarCollapsed ? "Recolher" : null}
            </Button>
          </div>
        </aside>

        <main
          className={cn(
            "min-h-screen flex-1 transition-[padding] duration-200",
            isSidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[268px]"
          )}
        >
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <span className="sr-only">Menu</span>
              </Button>

              <div className="min-w-[180px] flex-1">
                <p className="text-xs text-muted-foreground">
                  {navigationItems.find((item) => item.id === activeView)?.description}
                </p>
                <h1 className="text-xl font-semibold tracking-normal">
                  {navigationItems.find((item) => item.id === activeView)?.label}
                </h1>
              </div>

              <div className="relative order-last w-full md:order-none md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Pesquisar..."
                />
                <GlobalSearch />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  className="h-9 w-[116px]"
                  value={String(selectedMonth)}
                  onChange={(event) => setSelectedMonth(Number(event.target.value))}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </Select>
                <Select
                  className="h-9 w-[92px]"
                  value={String(selectedYear)}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>

                <RecordDialog>
                  <Button size="icon" variant="secondary">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Novo lançamento</span>
                  </Button>
                </RecordDialog>

                <Button variant="ghost" size="icon" onClick={() => exportProfileJson(currentProfile)}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Exportar perfil</span>
                </Button>

                <NotificationsDialog />
                <ThemeButton />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Sair</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
};
