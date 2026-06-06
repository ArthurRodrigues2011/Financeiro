import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { query } from "../db.js";

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["fixed", "variable", "loan", "income"]),
  color: z.string().min(4)
});

const recordSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative(),
  type: z.enum(["income", "fixed", "variable", "loan"]),
  categoryId: z.string().uuid(),
  dueDate: z.string(),
  paidDate: z.string().optional().nullable(),
  status: z.enum(["paid", "pending"]),
  tags: z.array(z.string()).default([])
});

const loanSchema = z.object({
  name: z.string().min(1),
  lender: z.string().optional(),
  installmentAmount: z.number().nonnegative(),
  totalInstallments: z.number().int().positive(),
  paidInstallments: z.number().int().nonnegative(),
  firstDueDate: z.string(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().nonnegative(),
  currentAmount: z.number().nonnegative(),
  targetDate: z.string().optional().nullable(),
  color: z.string().min(4),
  notes: z.string().optional()
});

router.get("/categories", async (request, response) => {
  const result = await query("select * from categories where user_id = $1 order by name", [request.user!.id]);
  response.json(result.rows);
});

router.post("/categories", async (request, response) => {
  const input = categorySchema.parse(request.body);
  const result = await query(
    `insert into categories (user_id, name, kind, color)
     values ($1, $2, $3, $4)
     returning *`,
    [request.user!.id, input.name, input.kind, input.color]
  );
  response.status(201).json(result.rows[0]);
});

router.get("/records", async (request, response) => {
  const result = await query(
    "select * from financial_records where user_id = $1 order by due_date desc",
    [request.user!.id]
  );
  response.json(result.rows);
});

router.post("/records", async (request, response) => {
  const input = recordSchema.parse(request.body);
  const result = await query(
    `insert into financial_records
     (user_id, category_id, name, description, amount, type, due_date, paid_date, status, tags)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning *`,
    [
      request.user!.id,
      input.categoryId,
      input.name,
      input.description || null,
      input.amount,
      input.type,
      input.dueDate,
      input.paidDate || null,
      input.status,
      input.tags
    ]
  );
  response.status(201).json(result.rows[0]);
});

router.get("/loans", async (request, response) => {
  const result = await query("select * from loans where user_id = $1 order by created_at desc", [request.user!.id]);
  response.json(result.rows);
});

router.post("/loans", async (request, response) => {
  const input = loanSchema.parse(request.body);
  const result = await query(
    `insert into loans
     (user_id, category_id, name, lender, installment_amount, total_installments, paid_installments, first_due_date, tags, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning *`,
    [
      request.user!.id,
      input.categoryId,
      input.name,
      input.lender || null,
      input.installmentAmount,
      input.totalInstallments,
      input.paidInstallments,
      input.firstDueDate,
      input.tags,
      input.notes || null
    ]
  );
  response.status(201).json(result.rows[0]);
});

router.get("/goals", async (request, response) => {
  const result = await query("select * from goals where user_id = $1 order by created_at desc", [request.user!.id]);
  response.json(result.rows);
});

router.post("/goals", async (request, response) => {
  const input = goalSchema.parse(request.body);
  const result = await query(
    `insert into goals (user_id, name, target_amount, current_amount, target_date, color, notes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      request.user!.id,
      input.name,
      input.targetAmount,
      input.currentAmount,
      input.targetDate || null,
      input.color,
      input.notes || null
    ]
  );
  response.status(201).json(result.rows[0]);
});

export default router;
