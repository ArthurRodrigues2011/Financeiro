import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type {
  Category,
  FinancialRecord,
  Goal,
  Loan,
  NewProfileInput,
  NotificationItem,
  ProfileData,
  UserProfile,
  ViewId
} from "../types";
import { createAudit, createProfile as buildProfile, sanitizeProfileForImport } from "../lib/profile";
import { profileStorage } from "../lib/storage";
import { createSalt, hashPassword, verifyPassword } from "../lib/security";
import { dispatchNotifications, scanNotifications } from "../lib/notifications";

type AppContextValue = {
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  activeView: ViewId;
  selectedYear: number;
  selectedMonth: number;
  searchQuery: string;
  isSidebarCollapsed: boolean;
  isLoading: boolean;
  setActiveView: (view: ViewId) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSearchQuery: (query: string) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  refreshProfiles: () => Promise<void>;
  createNewProfile: (input: NewProfileInput) => Promise<UserProfile>;
  login: (profileId: string, password: string) => Promise<boolean>;
  resetPassword: (profileId: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  deleteProfile: (profileId: string) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  setData: (updater: (data: ProfileData) => ProfileData) => Promise<void>;
  upsertRecord: (record: FinancialRecord) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  upsertLoan: (loan: Loan) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;
  upsertGoal: (goal: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  upsertCategory: (category: Category) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  importProfile: (profile: UserProfile) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const cloneData = (data: ProfileData): ProfileData => JSON.parse(JSON.stringify(data));

const now = () => new Date().toISOString();

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const today = new Date();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    setIsLoading(true);
    const nextProfiles = await profileStorage.list();
    nextProfiles.sort((a, b) => a.name.localeCompare(b.name));
    setProfiles(nextProfiles);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  useEffect(() => {
    const mode = currentProfile?.theme || "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "system" && systemDark));
  }, [currentProfile?.theme]);

  const persistProfile = useCallback(
    async (profile: UserProfile) => {
      await profileStorage.save(profile);
      setProfiles((items) => {
        const next = items.filter((item) => item.id !== profile.id);
        next.push(profile);
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setCurrentProfile((active) => (active?.id === profile.id ? profile : active));
    },
    []
  );

  const setData = useCallback(
    async (updater: (data: ProfileData) => ProfileData) => {
      if (!currentProfile) return;
      const nextData = updater(cloneData(currentProfile.data));
      const updated: UserProfile = {
        ...currentProfile,
        data: {
          ...nextData,
          updatedAt: now()
        },
        updatedAt: now()
      };
      await persistProfile(updated);
    },
    [currentProfile, persistProfile]
  );

  const createNewProfile = useCallback(
    async (input: NewProfileInput) => {
      const profile = await buildProfile(input);
      await persistProfile(profile);
      setCurrentProfile(profile);
      return profile;
    },
    [persistProfile]
  );

  const login = useCallback(
    async (profileId: string, password: string) => {
      const profile = profiles.find((item) => item.id === profileId) || (await profileStorage.get(profileId));
      if (!profile) return false;
      const ok = await verifyPassword(password, profile.passwordHash, profile.passwordSalt);
      if (ok) {
        setCurrentProfile(profile);
        setActiveView("dashboard");
      }
      return ok;
    },
    [profiles]
  );

  const resetPassword = useCallback(
    async (profileId: string, email: string, password: string) => {
      const profile = profiles.find((item) => item.id === profileId) || (await profileStorage.get(profileId));
      if (!profile || profile.email.toLowerCase() !== email.trim().toLowerCase()) return false;
      const salt = createSalt();
      const updated: UserProfile = {
        ...profile,
        passwordSalt: salt,
        passwordHash: await hashPassword(password, salt),
        data: {
          ...profile.data,
          auditLogs: [createAudit("profile", "updated", "Senha recuperada localmente"), ...profile.data.auditLogs],
          updatedAt: now()
        },
        updatedAt: now()
      };
      await persistProfile(updated);
      return true;
    },
    [persistProfile, profiles]
  );

  const logout = useCallback(() => {
    setCurrentProfile(null);
    setSearchQuery("");
  }, []);

  const deleteProfile = useCallback(
    async (profileId: string) => {
      await profileStorage.remove(profileId);
      setProfiles((items) => items.filter((item) => item.id !== profileId));
      setCurrentProfile((active) => (active?.id === profileId ? null : active));
    },
    []
  );

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!currentProfile) return;
      const updated: UserProfile = {
        ...currentProfile,
        ...patch,
        data: {
          ...currentProfile.data,
          auditLogs: [
            createAudit("profile", "updated", "Perfil atualizado"),
            ...currentProfile.data.auditLogs
          ],
          updatedAt: now()
        },
        updatedAt: now()
      };
      await persistProfile(updated);
    },
    [currentProfile, persistProfile]
  );

  const upsertRecord = useCallback(
    async (record: FinancialRecord) => {
      await setData((data) => {
        const exists = data.records.some((item) => item.id === record.id);
        return {
          ...data,
          records: exists
            ? data.records.map((item) => (item.id === record.id ? { ...record, updatedAt: now() } : item))
            : [{ ...record, createdAt: record.createdAt || now(), updatedAt: now() }, ...data.records],
          tags: [...new Set([...data.tags, ...record.tags])],
          auditLogs: [
            createAudit("record", exists ? "updated" : "created", record.name),
            ...data.auditLogs
          ]
        };
      });
    },
    [setData]
  );

  const removeRecord = useCallback(
    async (id: string) => {
      await setData((data) => {
        const removed = data.records.find((record) => record.id === id);
        return {
          ...data,
          records: data.records.filter((record) => record.id !== id),
          auditLogs: removed
            ? [createAudit("record", "deleted", removed.name), ...data.auditLogs]
            : data.auditLogs
        };
      });
    },
    [setData]
  );

  const upsertLoan = useCallback(
    async (loan: Loan) => {
      await setData((data) => {
        const exists = data.loans.some((item) => item.id === loan.id);
        return {
          ...data,
          loans: exists
            ? data.loans.map((item) => (item.id === loan.id ? { ...loan, updatedAt: now() } : item))
            : [{ ...loan, createdAt: loan.createdAt || now(), updatedAt: now() }, ...data.loans],
          tags: [...new Set([...data.tags, ...loan.tags])],
          auditLogs: [createAudit("loan", exists ? "updated" : "created", loan.name), ...data.auditLogs]
        };
      });
    },
    [setData]
  );

  const removeLoan = useCallback(
    async (id: string) => {
      await setData((data) => {
        const removed = data.loans.find((loan) => loan.id === id);
        return {
          ...data,
          loans: data.loans.filter((loan) => loan.id !== id),
          auditLogs: removed ? [createAudit("loan", "deleted", removed.name), ...data.auditLogs] : data.auditLogs
        };
      });
    },
    [setData]
  );

  const upsertGoal = useCallback(
    async (goal: Goal) => {
      await setData((data) => {
        const exists = data.goals.some((item) => item.id === goal.id);
        return {
          ...data,
          goals: exists
            ? data.goals.map((item) => (item.id === goal.id ? { ...goal, updatedAt: now() } : item))
            : [{ ...goal, createdAt: goal.createdAt || now(), updatedAt: now() }, ...data.goals],
          auditLogs: [createAudit("goal", exists ? "updated" : "created", goal.name), ...data.auditLogs]
        };
      });
    },
    [setData]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      await setData((data) => {
        const removed = data.goals.find((goal) => goal.id === id);
        return {
          ...data,
          goals: data.goals.filter((goal) => goal.id !== id),
          auditLogs: removed ? [createAudit("goal", "deleted", removed.name), ...data.auditLogs] : data.auditLogs
        };
      });
    },
    [setData]
  );

  const upsertCategory = useCallback(
    async (category: Category) => {
      await setData((data) => {
        const exists = data.categories.some((item) => item.id === category.id);
        return {
          ...data,
          categories: exists
            ? data.categories.map((item) => (item.id === category.id ? category : item))
            : [category, ...data.categories],
          auditLogs: [
            createAudit("category", exists ? "updated" : "created", category.name),
            ...data.auditLogs
          ]
        };
      });
    },
    [setData]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      await setData((data) => {
        const removed = data.categories.find((category) => category.id === id);
        return {
          ...data,
          categories: data.categories.filter((category) => category.id !== id),
          records: data.records.filter((record) => record.categoryId !== id),
          loans: data.loans.filter((loan) => loan.categoryId !== id),
          auditLogs: removed
            ? [createAudit("category", "deleted", removed.name), ...data.auditLogs]
            : data.auditLogs
        };
      });
    },
    [setData]
  );

  const importProfile = useCallback(
    async (profile: UserProfile) => {
      const imported = sanitizeProfileForImport(profile);
      await persistProfile(imported);
      setCurrentProfile(imported);
    },
    [persistProfile]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await setData((data) => ({
        ...data,
        notifications: data.notifications.map((item) =>
          item.id === id ? { ...item, read: true } : item
        )
      }));
    },
    [setData]
  );

  const clearNotifications = useCallback(async () => {
    await setData((data) => ({
      ...data,
      notifications: []
    }));
  }, [setData]);

  useEffect(() => {
    if (!currentProfile) return;
    const items = scanNotifications(currentProfile.data, selectedYear, selectedMonth);
    if (!items.length) return;
    dispatchNotifications(items, currentProfile.data);
    const mergeItems = async (notifications: NotificationItem[]) => {
      await setData((data) => ({
        ...data,
        notifications: [...notifications, ...data.notifications].slice(0, 80)
      }));
    };
    mergeItems(items);
  }, [currentProfile?.id, currentProfile?.data.updatedAt, selectedMonth, selectedYear, setData]);

  const value = useMemo<AppContextValue>(
    () => ({
      profiles,
      currentProfile,
      activeView,
      selectedYear,
      selectedMonth,
      searchQuery,
      isSidebarCollapsed,
      isLoading,
      setActiveView,
      setSelectedYear,
      setSelectedMonth,
      setSearchQuery,
      setIsSidebarCollapsed,
      refreshProfiles,
      createNewProfile,
      login,
      resetPassword,
      logout,
      deleteProfile,
      updateProfile,
      setData,
      upsertRecord,
      removeRecord,
      upsertLoan,
      removeLoan,
      upsertGoal,
      removeGoal,
      upsertCategory,
      removeCategory,
      importProfile,
      markNotificationRead,
      clearNotifications
    }),
    [
      profiles,
      currentProfile,
      activeView,
      selectedYear,
      selectedMonth,
      searchQuery,
      isSidebarCollapsed,
      isLoading,
      refreshProfiles,
      createNewProfile,
      login,
      resetPassword,
      logout,
      deleteProfile,
      updateProfile,
      setData,
      upsertRecord,
      removeRecord,
      upsertLoan,
      removeLoan,
      upsertGoal,
      removeGoal,
      upsertCategory,
      removeCategory,
      importProfile,
      markNotificationRead,
      clearNotifications
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser usado dentro de AppProvider");
  return context;
};
