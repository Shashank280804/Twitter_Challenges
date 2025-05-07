const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({ url: `redis://localhost:${REDIS_PORT}` });

const app = express();

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} GitHub repos</h2>`;
}

// Redis Cache Middleware (Promise-style)
async function cache(req, res, next) {
  const { username } = req.params;

  try {
    const data = await client.get(username);

    if (data !== null) {
      console.log('Serving from Redis ✅');
      return res.send(setResponse(username, data));
    }

    next(); // Not cached, continue to GitHub fetch
  } catch (err) {
    console.error('Redis cache error:', err);
    next(); // Fail safe: go to GitHub even if Redis fails
  }
}

// GitHub fetch + Redis setEx
async function getRepos(req, res) {
  try {
    console.log('Fetching from GitHub...');
    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    if (!data.public_repos && data.message) {
      return res.status(404).send(`<h2>${data.message}</h2>`);
    }

    const repos = data.public_repos;

    await client.setEx(username, 3600, repos.toString()); // ✅ this is a string

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error('GitHub fetch error:', err);
    res.status(500).send('Something went wrong');
  }
}

// Connect to Redis and start server
(async () => {
  try {
    await client.connect();
    console.log('✅ Redis connected');

    app.get('/repos/:username', cache, getRepos);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();
