// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

// ---------------------------
// Gestão de tokens (em memória)
// ---------------------------
let ACCESS_TOKEN = process.env.ML_ACCESS_TOKEN || '';
let REFRESH_TOKEN = process.env.ML_REFRESH_TOKEN || '';

async function refreshAccessToken() {
  const url = 'https://api.mercadolibre.com/oauth/token';
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error('Falha ao renovar token:', data);
    throw new Error('Não foi possível renovar o access_token');
  }

  ACCESS_TOKEN = data.access_token;
  if (data.refresh_token) {
    // O Mercado Livre pode rotacionar o refresh_token
    REFRESH_TOKEN = data.refresh_token;
  }
  console.log('✅ Novo access_token obtido com sucesso.');
}

// ---------------------------
// Rota de teste
// ---------------------------
app.get('/', (_, res) => {
  res.send('Servidor proxy do Mercado Livre funcionando!');
});

// ---------------------------
/**
 * Rota de busca:
 * Ex.: /api/search?q=celular&limit=5
 * Ex.: /api/search?category=MLB1000&sort=sold_quantity_desc&limit=10
 */
app.get('/api/search', async (req, res) => {
  try {
    // Parâmetros de busca
    const { q, category, limit = '20', sort = 'sold_quantity_desc' } = req.query;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    params.set('sort', String(sort));

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;

    // Função que faz a chamada à API do ML com o token atual
    const doFetch = () =>
      fetch(url, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      });

    // 1ª tentativa
    let resp = await doFetch();

    // Se deu não-autorizado/invalid token, tenta renovar e refazer uma vez
    if (resp.status === 401 || resp.status === 400) {
      const maybeError = await resp.json().catch(() => ({}));
      const msg = JSON.stringify(maybeError);
      if (msg.includes('invalid') || msg.includes('token')) {
        console.log('⚠️ Token inválido/expirado. Renovando e tentando novamente...');
        await refreshAccessToken();
        resp = await doFetch();
      } else {
        // Outro erro 400/401
        return res.status(resp.status).json(maybeError);
      }
    }

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Erro na API do ML:', resp.status, errText);
      return res.status(resp.status).send(errText);
    }

    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    console.error('Erro em /api/search:', err);
    return res.status(500).json({ error: 'Falha na busca de produtos' });
  }
});
// === Rota para renovar o token do Mercado Livre ===
app.get('/api/token/refresh', async (req, res) => {
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      refresh_token: process.env.ML_REFRESH_TOKEN
    });

    const r = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await r.json();
    // Se der certo, vem access_token; se der erro, volta o erro do ML
    res.status(r.ok ? 200 : 400).json(data);
  } catch (err) {
    console.error('Erro ao renovar token:', err);
    res.status(500).json({ error: 'refresh_failed' });
  }
});

// ---------------------------
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});
