// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const CLIENT_ID = "6265601993393948";
const CLIENT_SECRET = "7wThS4Tq1bdJ5e1BJcygzhEG8VW2xFLI";
const REFRESH_TOKEN = "COLOQUE_AQUI_SEU_REFRESH_TOKEN";

// Função para obter token de acesso
async function getAccessToken() {
  const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
    }),
  });
  return resp.json();
}

// Endpoint para buscar produtos
app.get("/produtos", async (req, res) => {
  try {
    const tokenData = await getAccessToken();
    const token = tokenData.access_token;

    const mlResp = await fetch(
      "https://api.mercadolibre.com/sites/MLB/search?q=eletronicos&limit=10",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await mlResp.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos", details: error });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
