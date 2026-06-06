import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { query } from "../db.js";

const router = Router();
router.use(requireAuth);

router.get("/me", async (request, response) => {
  const result = await query(
    `select id, name, email, photo_url, created_at, updated_at
     from users
     where id = $1`,
    [request.user!.id]
  );
  response.json(result.rows[0]);
});

router.patch("/me", async (request, response) => {
  const input = z
    .object({
      name: z.string().min(2).optional(),
      photoUrl: z.string().url().nullable().optional()
    })
    .parse(request.body);
  const result = await query(
    `update users
     set name = coalesce($2, name),
         photo_url = coalesce($3, photo_url),
         updated_at = now()
     where id = $1
     returning id, name, email, photo_url, updated_at`,
    [request.user!.id, input.name, input.photoUrl]
  );
  response.json(result.rows[0]);
});

router.get("/export", async (request, response) => {
  const [profile, categories, records, loans, goals] = await Promise.all([
    query("select id, name, email, photo_url from users where id = $1", [request.user!.id]),
    query("select * from categories where user_id = $1 order by name", [request.user!.id]),
    query("select * from financial_records where user_id = $1 order by due_date desc", [request.user!.id]),
    query("select * from loans where user_id = $1 order by created_at desc", [request.user!.id]),
    query("select * from goals where user_id = $1 order by created_at desc", [request.user!.id])
  ]);
  response.json({
    profile: profile.rows[0],
    categories: categories.rows,
    records: records.rows,
    loans: loans.rows,
    goals: goals.rows
  });
});

export default router;
