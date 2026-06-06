import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Paperclip, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Attachment, FinancialRecord, RecordStatus, RecordType } from "../../types";
import { fileToDataUrl, toISODate } from "../../lib/utils";
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

type RecordDialogProps = {
  record?: FinancialRecord;
  children: ReactNode;
};

const now = () => new Date().toISOString();

const emptyRecord = (categoryId: string, year: number, month: number): FinancialRecord => ({
  id: crypto.randomUUID(),
  name: "",
  amount: 0,
  type: "fixed",
  categoryId,
  dueDate: toISODate(new Date(year, month - 1, 10)),
  status: "pending",
  recurrence: "none",
  tags: [],
  attachments: [],
  createdAt: now(),
  updatedAt: now()
});

export const RecordDialog = ({ record, children }: RecordDialogProps) => {
  const { currentProfile, selectedYear, selectedMonth, upsertRecord } = useApp();
  const categories = currentProfile?.data.categories || [];
  const firstCategory = categories.find((category) => category.kind === "fixed") || categories[0];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FinancialRecord>(
    record || emptyRecord(firstCategory?.id || "", selectedYear, selectedMonth)
  );
  const [tagText, setTagText] = useState(record?.tags.join(", ") || "");

  useEffect(() => {
    if (!open) return;
    setDraft(record || emptyRecord(firstCategory?.id || "", selectedYear, selectedMonth));
    setTagText(record?.tags.join(", ") || "");
  }, [record, open, firstCategory?.id, selectedMonth, selectedYear]);

  const categoryOptions = useMemo(() => {
    const matching = categories.filter((category) => category.kind === draft.type);
    return matching.length ? matching : categories;
  }, [categories, draft.type]);

  const updateType = (type: RecordType) => {
    const nextCategory = categories.find((category) => category.kind === type) || categories[0];
    setDraft((item) => ({ ...item, type, categoryId: nextCategory?.id || item.categoryId }));
  };

  const addAttachments = async (files: FileList | null) => {
    if (!files?.length) return;
    const attachments: Attachment[] = await Promise.all(
      [...files].map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: await fileToDataUrl(file),
        createdAt: now()
      }))
    );
    setDraft((item) => ({ ...item, attachments: [...item.attachments, ...attachments] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upsertRecord({
      ...draft,
      amount: Number(draft.amount),
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      paidDate: draft.status === "paid" ? draft.paidDate || draft.dueDate : undefined,
      updatedAt: now()
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{record ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            Registre receitas, contas fixas, variáveis, parcelas e comprovantes.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="record-name">Nome</Label>
            <Input
              id="record-name"
              value={draft.name}
              onChange={(event) => setDraft((item) => ({ ...item, name: event.target.value }))}
              placeholder="Luz, mercado, salário..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="record-type">Tipo</Label>
              <Select
                id="record-type"
                value={draft.type}
                onChange={(event) => updateType(event.target.value as RecordType)}
              >
                <option value="income">Receita</option>
                <option value="fixed">Conta fixa</option>
                <option value="variable">Conta variável</option>
                <option value="loan">Parcela</option>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="record-category">Categoria</Label>
              <Select
                id="record-category"
                value={draft.categoryId}
                onChange={(event) => setDraft((item) => ({ ...item, categoryId: event.target.value }))}
                required
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="record-amount">Valor</Label>
              <Input
                id="record-amount"
                type="number"
                min="0"
                step="0.01"
                value={draft.amount || ""}
                onChange={(event) => setDraft((item) => ({ ...item, amount: Number(event.target.value) }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="record-due">Vencimento</Label>
              <Input
                id="record-due"
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((item) => ({ ...item, dueDate: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="record-status">Status</Label>
              <Select
                id="record-status"
                value={draft.status}
                onChange={(event) => setDraft((item) => ({ ...item, status: event.target.value as RecordStatus }))}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </Select>
            </div>
          </div>

          {draft.status === "paid" ? (
            <div className="grid gap-2">
              <Label htmlFor="record-paid-date">Data de pagamento</Label>
              <Input
                id="record-paid-date"
                type="date"
                value={draft.paidDate || draft.dueDate}
                onChange={(event) => setDraft((item) => ({ ...item, paidDate: event.target.value }))}
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="record-tags">Tags</Label>
            <Input
              id="record-tags"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="casa, família, urgente"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="record-description">Observações</Label>
            <Textarea
              id="record-description"
              value={draft.description || ""}
              onChange={(event) => setDraft((item) => ({ ...item, description: event.target.value }))}
              placeholder="Detalhes opcionais"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="record-files">Comprovantes</Label>
            <Input
              id="record-files"
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(event) => addAttachments(event.target.files)}
            />
            {draft.attachments.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {draft.attachments.map((attachment) => (
                  <span key={attachment.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <Paperclip className="h-3 w-3" />
                    {attachment.name}
                  </span>
                ))}
              </div>
            ) : null}
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
