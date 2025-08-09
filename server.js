
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Servidor proxy do Mercado Livre funcionando!');
});

app.get('/api', async (req, res) => {
  try {
    const response = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=celular');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do Mercado Livre' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
