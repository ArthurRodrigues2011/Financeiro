import { useState, type FormEvent } from "react";
import { ArrowRight, FileUp, KeyRound, Loader2, Plus, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { readJsonFile } from "../lib/importExport";
import { fileToDataUrl } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../components/ui/dialog";
import { Input, Label } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const ResetPasswordDialog = ({ profileId }: { profileId: string }) => {
  const { resetPassword } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await resetPassword(profileId, email, password);
    setMessage(ok ? "Senha atualizada. Você já pode entrar." : "Email não confere com este perfil.");
    if (ok) {
      setEmail("");
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <KeyRound className="h-4 w-4" />
          Recuperar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperação local</DialogTitle>
          <DialogDescription>Confirme o email do perfil e defina uma nova senha neste dispositivo.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reset-password">Nova senha</Label>
            <Input
              id="reset-password"
              type="password"
              minLength={4}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <DialogFooter>
            <Button type="submit">Atualizar senha</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ProfileGate = () => {
  const { profiles, isLoading, createNewProfile, login, importProfile } = useApp();
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: "",
    email: "",
    password: "",
    photo: ""
  });

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) || profiles[0];

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    const targetId = selectedProfile?.id;
    if (!targetId) return;
    setIsSubmitting(true);
    const ok = await login(targetId, password);
    setIsSubmitting(false);
    if (!ok) setLoginError("Senha inválida para este perfil.");
  };

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    await createNewProfile(newProfile);
    setIsSubmitting(false);
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    const profile = await readJsonFile(file);
    await importProfile(profile);
  };

  const loadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setNewProfile((item) => ({ ...item, photo: await fileToDataUrl(file) }));
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <img src="./brand-mark.svg" alt="" className="h-12 w-12 rounded-xl shadow-soft" />
            <div>
              <p className="text-sm text-muted-foreground">PWA offline e multiusuário</p>
              <h1 className="text-3xl font-semibold tracking-normal">Controle Financeiro</h1>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <ShieldCheck className="h-5 w-5 text-teal-500" />
              Dados separados por perfil, salvos no navegador com IndexedDB.
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <FileUp className="h-5 w-5 text-amber-500" />
              Backup completo em JSON e importação de planilhas Excel.
            </div>
          </div>
        </section>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Entrar ou criar perfil</CardTitle>
            <CardDescription>Escolha Arthur, Pai, Mãe, Empresa ou crie quantos perfis precisar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={profiles.length ? "login" : "create"}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Perfil</TabsTrigger>
                <TabsTrigger value="create">Criar</TabsTrigger>
                <TabsTrigger value="import">Importar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando perfis
                  </div>
                ) : profiles.length ? (
                  <form className="grid gap-4" onSubmit={submitLogin}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          className={`rounded-lg border p-4 text-left transition hover:bg-muted ${
                            (selectedProfileId || selectedProfile?.id) === profile.id ? "border-primary bg-muted" : "bg-card"
                          }`}
                          onClick={() => setSelectedProfileId(profile.id)}
                        >
                          <div className="flex items-center gap-3">
                            {profile.photo ? (
                              <img src={profile.photo} alt="" className="h-10 w-10 rounded-md object-cover" />
                            ) : (
                              <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary font-semibold text-secondary-foreground">
                                {profile.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium">{profile.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>

                    {loginError ? <p className="text-sm text-rose-600">{loginError}</p> : null}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {selectedProfile ? <ResetPasswordDialog profileId={selectedProfile.id} /> : <span />}
                      <Button type="submit" disabled={isSubmitting}>
                        Entrar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Nenhum perfil local encontrado. Crie o primeiro perfil ou restaure um backup.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create">
                <form className="grid gap-4" onSubmit={submitCreate}>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name">Nome</Label>
                    <Input
                      id="profile-name"
                      value={newProfile.name}
                      onChange={(event) => setNewProfile((item) => ({ ...item, name: event.target.value }))}
                      placeholder="Arthur, Pai, Mãe, Empresa..."
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={newProfile.email}
                      onChange={(event) => setNewProfile((item) => ({ ...item, email: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-password">Senha</Label>
                    <Input
                      id="profile-password"
                      type="password"
                      minLength={4}
                      value={newProfile.password}
                      onChange={(event) => setNewProfile((item) => ({ ...item, password: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-photo">Foto opcional</Label>
                    <Input id="profile-photo" type="file" accept="image/*" onChange={(event) => loadPhoto(event.target.files?.[0])} />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    <Plus className="h-4 w-4" />
                    Criar perfil
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="import">
                <div className="grid gap-4">
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Restaure um backup JSON completo exportado por este sistema. O perfil importado mantém seus próprios dados.
                  </div>
                  <Input type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
