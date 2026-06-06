import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import financeRoutes from "./routes/finance.js";
import profileRoutes from "./routes/profile.js";

const app = express();
const port = Number(process.env.PORT || 3333);

app.use(
  cors({
    origin: process.env.APP_URL?.split(",") || true,
    credentials: true
  })
);
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "controle-financeiro-api" });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/finance", financeRoutes);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(400).json({ error: "Requisição inválida" });
});

app.listen(port, () => {
  console.log(`API pronta em http://localhost:${port}`);
});
