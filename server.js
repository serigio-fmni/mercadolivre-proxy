// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Variáveis de ambiente (Render -> Environment)
const ML_ACCESS_TOKEN  = process.env.ML_ACCESS_TOKEN || "";
const ML_REFRESH_TOKEN = process.env.ML_REFRESH_TOKEN || "";
const ML_CLIENT_ID     = process.env.ML_CLIENT_ID || "";
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || "";

/**
 * Raiz — só pra ver se o proxy está vivo
 */
app.get("/", (_req, res) => {
  res.send("Servidor proxy do Mercado Livre funcionando!");
});

/**
 * Quem sou eu? (usa token) — teste rápido do token atual
 * GET /api/whoami
 */
app.get("/api/whoami", async (_req, res) => {
  try {
    const r = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${ML_ACCESS_TOKEN}` },
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("Erro /api/whoami:", err);
    return res.status(500).json({ error: "Falha ao consultar /users/me" });
  }
});

/**
 * BUSCA de produtos (SEM Authorization) — evita 403
 * GET /api/search?q=iphone&limit=10&sort=sold_quantity_desc&category=MLB1000
 * - q (texto), category (MLB...), sort (padrão sold_quantity_desc), limit
 */
app.get("/api/search", async (req, res) => {
  try {
    const { q, category, sort = "sold_quantity_desc", limit = "20" } = req.query;

    const params = new URLSearchParams();
    if (q) params.set("q", String(q));
    if (category) params.set("category", String(category));
    params.set("sort", String(sort));
    params.set("limit", String(limit));

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;

    // Importante: SEM Authorization aqui
    const r = await fetch(url);
    const data = await r.json();

    // Repassa o status exato que a API retornar
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("Erro /api/search:", err);
    return res.status(500).json({ error: "Falha ao buscar produtos" });
  }
});

/**
 * Renovar token com refresh_token
 * GET /api/token/refresh
 */
app.get("/api/token/refresh", async (_req, res) => {
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      refresh_token: ML_REFRESH_TOKEN,
    });

    const r = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("Erro /api/token/refresh:", err);
    return res.status(500).json({ error: "Falha ao renovar token" });
  }
});

/**
 * Healthcheck simples
 */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
