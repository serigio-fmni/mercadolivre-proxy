// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor proxy do Mercado Livre funcionando!');
});

// Rota de busca
// Ex.: /api/search?q=celular&limit=5
//      /api/search?category=MLB1000&sort=sold_quantity_desc&limit=10
app.get('/api/search', async (req, res) => {
  try {
    const { q, category, limit = 20, sort = 'sold_quantity_desc' } = req.query;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    params.set('sort', String(sort));

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ML_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro ML:', response.status, errText);
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Erro /api/search:', err);
    res.status(500).json({ error: 'Falha ao buscar produtos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
