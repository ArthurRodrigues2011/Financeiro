import { createDefaultCategories, defaultNotificationSettings } from "../constants";
import type { AuditLog, NewProfileInput, ProfileData, UserProfile } from "../types";
import { createSalt, hashPassword } from "./security";

export const createAudit = (
  entity: AuditLog["entity"],
  action: AuditLog["action"],
  label: string
): AuditLog => ({
  id: crypto.randomUUID(),
  entity,
  action,
  label,
  createdAt: new Date().toISOString()
});

export const createEmptyProfileData = (): ProfileData => ({
  categories: createDefaultCategories(),
  records: [],
  loans: [],
  goals: [],
  notifications: [],
  auditLogs: [createAudit("profile", "created", "Perfil criado")],
  tags: [],
  notificationSettings: defaultNotificationSettings,
  updatedAt: new Date().toISOString()
});

export const createProfile = async (input: NewProfileInput): Promise<UserProfile> => {
  const salt = createSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    photo: input.photo,
    passwordHash,
    passwordSalt: salt,
    theme: "system",
    provider: "local",
    data: createEmptyProfileData(),
    createdAt: now,
    updatedAt: now
  };
};

export const sanitizeProfileForImport = (profile: UserProfile): UserProfile => {
  const now = new Date().toISOString();
  return {
    ...profile,
    id: profile.id || crypto.randomUUID(),
    provider: profile.provider || "local",
    theme: profile.theme || "system",
    data: {
      ...createEmptyProfileData(),
      ...profile.data,
      categories: profile.data?.categories?.length
        ? profile.data.categories
        : createDefaultCategories(),
      records: profile.data?.records || [],
      loans: profile.data?.loans || [],
      goals: profile.data?.goals || [],
      notifications: profile.data?.notifications || [],
      auditLogs: [
        ...(profile.data?.auditLogs || []),
        createAudit("backup", "imported", "Backup restaurado")
      ],
      tags: profile.data?.tags || [],
      notificationSettings: {
        ...defaultNotificationSettings,
        ...(profile.data?.notificationSettings || {}),
        channels: {
          ...defaultNotificationSettings.channels,
          ...(profile.data?.notificationSettings?.channels || {})
        }
      },
      updatedAt: now
    },
    createdAt: profile.createdAt || now,
    updatedAt: now
  };
};
