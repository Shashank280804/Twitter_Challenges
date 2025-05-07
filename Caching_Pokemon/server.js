const express = require('express');
const redis = require('redis');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({ url: `redis://localhost:${REDIS_PORT}` });

app.use(express.static(path.join(__dirname, 'public')));

async function cache(req, res, next) {
  const { name } = req.params;
  try {
    const data = await client.get(name.toLowerCase());
    if (data) {
      return res.json({ source: 'Redis ✅', data: JSON.parse(data) });
    }
    next();
  } catch (err) {
    console.error('Redis cache error:', err);
    next();
  }
}

app.get('/pokemon/:name', cache, async (req, res) => {
  const { name } = req.params;
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
    if (!response.ok) return res.status(404).json({ error: 'Pokémon not found' });

    const data = await response.json();
    const pokemon = {
      name: data.name,
      id: data.id,
      types: data.types.map(t => t.type.name),
      sprite: data.sprites.other['official-artwork'].front_default,
      stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
    };

    await client.setEx(name.toLowerCase(), 3600, JSON.stringify(pokemon));
    res.json({ source: 'PokéAPI 🌐', data: pokemon });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Redis connected');
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Redis failed:', err);
  }
})();
