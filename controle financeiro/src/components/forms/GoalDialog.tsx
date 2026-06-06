import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Save } from "lucide-react";
import { categoryPalette } from "../../constants";
import { useApp } from "../../context/AppContext";
import type { Goal } from "../../types";
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
import { Input, Label, Textarea } from "../ui/input";

type GoalDialogProps = {
  goal?: Goal;
  children: ReactNode;
};

const now = () => new Date().toISOString();

export const GoalDialog = ({ goal, children }: GoalDialogProps) => {
  const { upsertGoal } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Goal>(
    goal || {
      id: crypto.randomUUID(),
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      color: categoryPalette[0],
      createdAt: now(),
      updatedAt: now()
    }
  );

  useEffect(() => {
    if (!open) return;
    setDraft(
      goal || {
        id: crypto.randomUUID(),
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        color: categoryPalette[0],
        createdAt: now(),
        updatedAt: now()
      }
    );
  }, [goal, open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertGoal({
      ...draft,
      targetAmount: Number(draft.targetAmount),
      currentAmount: Number(draft.currentAmount),
      updatedAt: now()
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta financeira"}</DialogTitle>
          <DialogDescription>Defina um objetivo, valor atual e prazo opcional.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="goal-name">Nome</Label>
            <Input
              id="goal-name"
              value={draft.name}
              onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))}
              placeholder="Comprar moto, reserva de emergência..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="goal-target">Valor objetivo</Label>
              <Input
                id="goal-target"
                type="number"
                min="0"
                step="0.01"
                value={draft.targetAmount || ""}
                onChange={(event) => setDraft((item) => ({ ...item, targetAmount: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-current">Valor atual</Label>
              <Input
                id="goal-current"
                type="number"
                min="0"
                step="0.01"
                value={draft.currentAmount || ""}
                onChange={(event) => setDraft((item) => ({ ...item, currentAmount: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-date">Prazo</Label>
              <Input
                id="goal-date"
                type="date"
                value={draft.targetDate || ""}
                onChange={(event) => setDraft((item) => ({ ...item, targetDate: event.target.value }))}
              />
            </div>
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

          <div className="grid gap-2">
            <Label htmlFor="goal-notes">Observações</Label>
            <Textarea
              id="goal-notes"
              value={draft.notes || ""}
              onChange={(event) => setDraft((item) => ({ ...item, notes: event.target.value }))}
            />
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
