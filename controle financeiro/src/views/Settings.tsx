import { Download, Edit3, KeyRound, Plus, Trash2, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CategoryDialog } from "../components/forms/CategoryDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label, Select } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useApp } from "../context/AppContext";
import { exportProfileJson, readJsonFile } from "../lib/importExport";
import { requestBrowserNotifications } from "../lib/notifications";
import { fileToDataUrl } from "../lib/utils";
import type { NotificationChannel, ThemeMode } from "../types";

const channelLabels: Record<NotificationChannel, string> = {
  inApp: "Sistema",
  browser: "Navegador",
  email: "Email",
  push: "Push"
};

export const Settings = () => {
  const {
    currentProfile,
    updateProfile,
    setData,
    removeCategory,
    importProfile,
    deleteProfile,
    logout
  } = useApp();
  const [profileDraft, setProfileDraft] = useState({
    name: currentProfile?.name || "",
    email: currentProfile?.email || ""
  });
  const [message, setMessage] = useState("");

  if (!currentProfile) return null;

  const settings = currentProfile.data.notificationSettings;

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfile(profileDraft);
    setMessage("Perfil atualizado.");
  };

  const updatePhoto = async (file: File | undefined) => {
    if (!file) return;
    await updateProfile({ photo: await fileToDataUrl(file) });
  };

  const updateNotification = async <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    await setData((data) => ({
      ...data,
      notificationSettings: {
        ...data.notificationSettings,
        [key]: value
      }
    }));
  };

  const updateChannel = async (channel: NotificationChannel, value: boolean) => {
    if (channel === "browser" && value) {
      await requestBrowserNotifications();
    }
    await setData((data) => ({
      ...data,
      notificationSettings: {
        ...data.notificationSettings,
        channels: {
          ...data.notificationSettings.channels,
          [channel]: value
        }
      }
    }));
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    await importProfile(await readJsonFile(file));
  };

  const removeCurrentProfile = async () => {
    await deleteProfile(currentProfile.id);
    logout();
  };

  return (
    <Tabs defaultValue="profile">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="notifications">Notificações</TabsTrigger>
        <TabsTrigger value="backup">Backup</TabsTrigger>
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Dados do perfil</CardTitle>
              <CardDescription>Nome, email, foto e tema ficam salvos neste navegador.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={saveProfile}>
                <div className="flex items-center gap-4">
                  {currentProfile.photo ? (
                    <img src={currentProfile.photo} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-lg bg-secondary text-xl font-semibold text-secondary-foreground">
                      {currentProfile.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <Input className="max-w-sm" type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="settings-name">Nome</Label>
                  <Input
                    id="settings-name"
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((item) => ({ ...item, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((item) => ({ ...item, email: event.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="settings-theme">Tema</Label>
                  <Select
                    id="settings-theme"
                    value={currentProfile.theme}
                    onChange={(event) => updateProfile({ theme: event.target.value as ThemeMode })}
                  >
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </Select>
                </div>
                <Button type="submit">Salvar perfil</Button>
                {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração futura</CardTitle>
              <CardDescription>Camada de dados pronta para sincronização online posterior.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border p-4">
                <p className="font-medium">Modo atual</p>
                <p className="text-sm text-muted-foreground">Local offline</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">Supabase</p>
                <p className="text-sm text-muted-foreground">Estrutura preparada</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">Firebase</p>
                <p className="text-sm text-muted-foreground">Estrutura preparada</p>
              </div>
              <Button variant="destructive" onClick={removeCurrentProfile}>
                Excluir perfil atual
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="categories">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Contas fixas, variáveis, receitas e financiamentos personalizados.</CardDescription>
            </div>
            <CategoryDialog>
              <Button>
                <Plus className="h-4 w-4" />
                Nova categoria
              </Button>
            </CategoryDialog>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {currentProfile.data.categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{category.kind}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <CategoryDialog category={category}>
                      <Button variant="ghost" size="icon">
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </CategoryDialog>
                    <Button variant="ghost" size="icon" onClick={() => removeCategory(category.id)}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Alertas locais de vencimento, parcelas, metas e gastos.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <label className="flex items-center justify-between gap-3 rounded-lg border p-4">
              <span>
                <span className="block text-sm font-medium">Ativar notificações</span>
                <span className="text-sm text-muted-foreground">Controle geral dos alertas deste perfil.</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={settings.enabled}
                onChange={(event) => updateNotification("enabled", event.target.checked)}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(settings.channels).map(([channel, enabled]) => (
                <label key={channel} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <span className="text-sm font-medium">{channelLabels[channel as NotificationChannel]}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={enabled}
                    onChange={(event) => updateChannel(channel as NotificationChannel, event.target.checked)}
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["dueTomorrow", "Conta vence amanhã"],
                ["dueToday", "Conta vence hoje"],
                ["loanUpcoming", "Parcela próxima"],
                ["goalReached", "Meta atingida"],
                ["spendingAboveAverage", "Gastos acima da média"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                  <span className="text-sm font-medium">{label}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={Boolean(settings[key as keyof typeof settings])}
                    onChange={(event) => updateNotification(key as keyof typeof settings, event.target.checked as never)}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Exportação completa</CardTitle>
              <CardDescription>Inclui perfil, categorias, lançamentos, metas, anexos, histórico e preferências.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => exportProfileJson(currentProfile)}>
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
              <Badge variant="success">Salvamento automático local ativo</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Restaurar backup</CardTitle>
              <CardDescription>Importa um perfil completo sem depender de servidor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
                <Upload className="h-5 w-5 text-teal-500" />
                <Input type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de alterações</CardTitle>
            <CardDescription>Auditoria local dos principais registros.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {currentProfile.data.auditLogs.slice(0, 80).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{log.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity} · {log.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
            {!currentProfile.data.auditLogs.length ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum evento registrado.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
