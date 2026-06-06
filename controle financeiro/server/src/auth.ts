import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return secret;
};

export const signToken = (user: AuthUser) =>
  jwt.sign(user, jwtSecret(), {
    expiresIn: "7d"
  });

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const [, token] = (request.headers.authorization || "").split(" ");
  if (!token) {
    response.status(401).json({ error: "Token ausente" });
    return;
  }

  try {
    request.user = jwt.verify(token, jwtSecret()) as AuthUser;
    next();
  } catch {
    response.status(401).json({ error: "Token inválido" });
  }
};
