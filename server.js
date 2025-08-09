// ROTA: busca produtos no Mercado Livre via proxy
// Ex.: /api/search?q=fone&limit=12  ou  /api/search?category=MLB1000&sort=sold_quantity_desc
app.get('/api/search', async (req, res) => {
  try {
    const { q, category, limit = '20', sort = 'sold_quantity_desc' } = req.query;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('limit', String(limit));
    params.set('sort', String(sort));

    const url = `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error('Erro /api/search:', err);
    res.status(500).json({ error: 'Falha ao buscar produtos' });
  }
});
