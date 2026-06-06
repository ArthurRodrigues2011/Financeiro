import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = <T>(text: string, params: unknown[] = []) =>
  pool.query<T>(text, params);
