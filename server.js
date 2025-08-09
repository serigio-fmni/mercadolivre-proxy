import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

// Vars vindas do Render (já configuradas)
const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = 'https://mercadolivre-proxy.onrender.com/callback';

// Guardaremos o token em memória (e você depois salva no Render)
let ACCESS_TOKEN = process.env.ML_ACCESS_TOKEN || '';
let REFRESH_TOKEN = process.env.ML_REFRESH_TOKEN || '';

app.use(cors());

// Home
app.get('/', (req, res) => {
  res.send('Servidor proxy do Mercado Livre funcionando!');
});

// Rota que busca produtos no Mercado Livre via proxy
// Ex.: /api/search?q=fone&limit=12  OU  /api/search?category=MLB1000&sort=sold_quantity_desc&limit=10
app.get('/api/search', async (req, res) => {
  try {
    const { q, category, limit = '20', sort = 'sold_quantity_desc' } = req.query;

    // Monta query para a API do ML
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    params.set('sort', String(sort));

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;

    // Token obrigatório agora:
    if (!ACCESS_TOKEN) {
      return res.status(401).json({
        code: 'unauthorized',
        message: 'authorization value not present (defina ML_ACCESS_TOKEN ou faça /callback)',
      });
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    // Se o token expirou, retorna o erro do ML (podemos melhorar com refresh depois)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json(err);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Erro /api/search:', err);
    res.status(500).json({ error: 'Falha ao buscar produtos' });
  }
});

// Rota de callback do OAuth: troca "code" por access_token
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET,
      code: String(code),
      redirect_uri: REDIRECT_URI,
    });

    const r = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const json = await r.json();

    if (!r.ok) {
      console.error('Erro ao trocar code por token:', json);
      return res.status(400).send(`<pre>${JSON.stringify(json, null, 2)}</pre>`);
    }

    // Guarda em memória
    ACCESS_TOKEN = json.access_token;
    REFRESH_TOKEN = json.refresh_token || REFRESH_TOKEN;

    // Mostra para você copiar e salvar no Render
    res.send(
      `<h3>Tokens recebidos</h3>
      <p><b>access_token</b> (copie e salve no Render como ML_ACCESS_TOKEN):</p>
      <pre>${json.access_token}</pre>
      <p><b>refresh_token</b> (opcional, salve como ML_REFRESH_TOKEN):</p>
      <pre>${json.refresh_token || '(não veio)'}</pre>
      <p>Depois de salvar, teste: <code>/api/search?q=celular&limit=5</code></p>`
    );
  } catch (err) {
    console.error('Erro /callback:', err);
    res.status(500).send('Erro ao trocar code por token');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
