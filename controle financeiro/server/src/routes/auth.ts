import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { signToken } from "../auth.js";
import { query } from "../db.js";

const router = Router();

const credentials = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", async (request, response) => {
  const input = credentials.extend({ name: z.string().min(2) }).parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await query<{ id: string; name: string; email: string }>(
    `insert into users (name, email, password_hash)
     values ($1, $2, $3)
     returning id, name, email`,
    [input.name, input.email.toLowerCase(), passwordHash]
  );
  const user = result.rows[0];
  response.status(201).json({ user, token: signToken({ id: user.id, email: user.email }) });
});

router.post("/login", async (request, response) => {
  const input = credentials.omit({ name: true }).parse(request.body);
  const result = await query<{ id: string; name: string; email: string; password_hash: string }>(
    "select id, name, email, password_hash from users where email = $1",
    [input.email.toLowerCase()]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    response.status(401).json({ error: "Credenciais inválidas" });
    return;
  }
  response.json({
    user: { id: user.id, name: user.name, email: user.email },
    token: signToken({ id: user.id, email: user.email })
  });
});

router.post("/password/request", async (request, response) => {
  const input = z.object({ email: z.string().email() }).parse(request.body);
  await query(
    `insert into password_reset_requests (email, token, expires_at)
     values ($1, encode(gen_random_bytes(24), 'hex'), now() + interval '30 minutes')`,
    [input.email.toLowerCase()]
  );
  response.json({ ok: true });
});

router.post("/password/reset", async (request, response) => {
  const input = z
    .object({
      email: z.string().email(),
      token: z.string().min(12),
      password: z.string().min(6)
    })
    .parse(request.body);
  const reset = await query<{ id: string }>(
    `select id from password_reset_requests
     where email = $1 and token = $2 and used_at is null and expires_at > now()
     order by created_at desc
     limit 1`,
    [input.email.toLowerCase(), input.token]
  );
  if (!reset.rows[0]) {
    response.status(400).json({ error: "Token inválido ou expirado" });
    return;
  }
  await query("update users set password_hash = $1 where email = $2", [
    await bcrypt.hash(input.password, 12),
    input.email.toLowerCase()
  ]);
  await query("update password_reset_requests set used_at = now() where id = $1", [reset.rows[0].id]);
  response.json({ ok: true });
});

export default router;
