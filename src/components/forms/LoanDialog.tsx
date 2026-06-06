import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Loan } from "../../types";
import { toISODate } from "../../lib/utils";
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
import { Input, Label, Select, Textarea } from "../ui/input";

type LoanDialogProps = {
  loan?: Loan;
  children: ReactNode;
};

const now = () => new Date().toISOString();

export const LoanDialog = ({ loan, children }: LoanDialogProps) => {
  const { currentProfile, upsertLoan } = useApp();
  const categories = currentProfile?.data.categories || [];
  const loanCategory = categories.find((category) => category.kind === "loan") || categories[0];
  const [open, setOpen] = useState(false);
  const [tagText, setTagText] = useState(loan?.tags.join(", ") || "");
  const [draft, setDraft] = useState<Loan>(
    loan || {
      id: crypto.randomUUID(),
      name: "",
      installmentAmount: 0,
      totalInstallments: 12,
      paidInstallments: 0,
      firstDueDate: toISODate(),
      categoryId: loanCategory?.id || "",
      tags: [],
      createdAt: now(),
      updatedAt: now()
    }
  );

  useEffect(() => {
    if (!open) return;
    setDraft(
      loan || {
        id: crypto.randomUUID(),
        name: "",
        installmentAmount: 0,
        totalInstallments: 12,
        paidInstallments: 0,
        firstDueDate: toISODate(),
        categoryId: loanCategory?.id || "",
        tags: [],
        createdAt: now(),
        updatedAt: now()
      }
    );
    setTagText(loan?.tags.join(", ") || "");
  }, [loan, loanCategory?.id, open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertLoan({
      ...draft,
      paidInstallments: Math.min(Number(draft.paidInstallments), Number(draft.totalInstallments)),
      installmentAmount: Number(draft.installmentAmount),
      totalInstallments: Number(draft.totalInstallments),
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      updatedAt: now()
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{loan ? "Editar financiamento" : "Novo financiamento"}</DialogTitle>
          <DialogDescription>Controle parcelas pagas, restantes e data de término.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="loan-name">Nome</Label>
            <Input
              id="loan-name"
              value={draft.name}
              onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))}
              placeholder="Empréstimo, carro, cartão parcelado..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="loan-lender">Instituição</Label>
              <Input
                id="loan-lender"
                value={draft.lender || ""}
                onChange={(event) => setDraft((item) => ({ ...item, lender: event.target.value }))}
                placeholder="Banco, loja, pessoa..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-category">Categoria</Label>
              <Select
                id="loan-category"
                value={draft.categoryId}
                onChange={(event) => setDraft((item) => ({ ...item, categoryId: event.target.value }))}
              >
                {categories
                  .filter((category) => category.kind === "loan")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="loan-amount">Parcela</Label>
              <Input
                id="loan-amount"
                type="number"
                min="0"
                step="0.01"
                value={draft.installmentAmount || ""}
                onChange={(event) => setDraft((item) => ({ ...item, installmentAmount: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-total">Total</Label>
              <Input
                id="loan-total"
                type="number"
                min="1"
                value={draft.totalInstallments}
                onChange={(event) => setDraft((item) => ({ ...item, totalInstallments: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-paid">Pagas</Label>
              <Input
                id="loan-paid"
                type="number"
                min="0"
                max={draft.totalInstallments}
                value={draft.paidInstallments}
                onChange={(event) => setDraft((item) => ({ ...item, paidInstallments: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-first">1º vencimento</Label>
              <Input
                id="loan-first"
                type="date"
                value={draft.firstDueDate}
                onChange={(event) => setDraft((item) => ({ ...item, firstDueDate: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loan-tags">Tags</Label>
            <Input
              id="loan-tags"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="família, carro, longo prazo"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loan-notes">Observações</Label>
            <Textarea
              id="loan-notes"
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
