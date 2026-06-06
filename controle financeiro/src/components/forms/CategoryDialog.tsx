import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Save } from "lucide-react";
import { categoryPalette } from "../../constants";
import { useApp } from "../../context/AppContext";
import type { Category, CategoryKind } from "../../types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input, Label, Select } from "../ui/input";

type CategoryDialogProps = {
  category?: Category;
  children: ReactNode;
};

const now = () => new Date().toISOString();

export const CategoryDialog = ({ category, children }: CategoryDialogProps) => {
  const { upsertCategory } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Category>(
    category || {
      id: crypto.randomUUID(),
      name: "",
      kind: "variable",
      color: categoryPalette[1],
      createdAt: now()
    }
  );

  useEffect(() => {
    if (!open) return;
    setDraft(
      category || {
        id: crypto.randomUUID(),
        name: "",
        kind: "variable",
        color: categoryPalette[1],
        createdAt: now()
      }
    );
  }, [category, open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertCategory(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Organize receitas, contas fixas, variáveis e parcelas.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              value={draft.name}
              onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category-kind">Tipo</Label>
            <Select
              id="category-kind"
              value={draft.kind}
              onChange={(event) => setDraft((item) => ({ ...item, kind: event.target.value as CategoryKind }))}
            >
              <option value="income">Receitas</option>
              <option value="fixed">Fixas</option>
              <option value="variable">Variáveis</option>
              <option value="loan">Financiamentos e empréstimos</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {categoryPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Selecionar cor ${color}`}
                  className="h-8 w-8 rounded-md border border-border ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    backgroundColor: color,
                    outline: draft.color === color ? "2px solid hsl(var(--foreground))" : "none"
                  }}
                  onClick={() => setDraft((item) => ({ ...item, color }))}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
