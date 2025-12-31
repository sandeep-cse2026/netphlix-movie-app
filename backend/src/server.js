const path = require("path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {
  tmdbGetJson,
  pickMovie,
  pickTv,
  pickSearchResult,
  createMemoryCache
} = require("./tmdb");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();

const PORT = Number.parseInt(process.env.PORT || "5173", 10);
const CACHE_TTL_MS = Number.parseInt(process.env.CACHE_TTL_MS || "300000", 10); // 5 minutes
const SERVE_FRONTEND = String(process.env.SERVE_FRONTEND || "true").toLowerCase() === "true";

const cache = createMemoryCache({ ttlMs: CACHE_TTL_MS });

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

function cacheKey(req) {
  return `${req.method}:${req.path}?${new URLSearchParams(req.query).toString()}`;
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.get(
  "/api/health",
  (req, res) => {
    res.json({ ok: true, now: Date.now() });
  }
);

// Search (multi)
// GET /api/search?query=...&page=1
app.get(
  "/api/search",
  asyncRoute(async (req, res) => {
    const query = String(req.query.query || req.query.q || "").trim();
    const page = Number.parseInt(req.query.page || "1", 10);
    const includeAdult = String(req.query.include_adult || "false") === "true";

    if (!query) return res.json({ page: 1, results: [], totalPages: 0, totalResults: 0 });

    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson("/search/multi", {
      query,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      include_adult: includeAdult
    });

    const results = Array.isArray(json.results)
      ? json.results
          .map(pickSearchResult)
          .filter(Boolean)
      : [];

    const payload = {
      page: json.page ?? 1,
      results,
      totalPages: json.total_pages ?? 0,
      totalResults: json.total_results ?? 0
    };

    cache.set(key, payload);
    res.json(payload);
  })
);

// Discover movies
// GET /api/discover/movie?page=1
app.get(
  "/api/discover/movie",
  asyncRoute(async (req, res) => {
    const page = Number.parseInt(req.query.page || "1", 10);
    
    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson("/discover/movie", {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      sort_by: "popularity.desc",
      include_adult: false
    });

    const results = Array.isArray(json.results)
      ? json.results.map(pickMovie).filter(Boolean)
      : [];

    const payload = {
      page: json.page ?? 1,
      results,
      totalPages: json.total_pages ?? 0,
      totalResults: json.total_results ?? 0
    };

    cache.set(key, payload);
    res.json(payload);
  })
);

// Discover TV shows
// GET /api/discover/tv?page=1
app.get(
  "/api/discover/tv",
  asyncRoute(async (req, res) => {
    const page = Number.parseInt(req.query.page || "1", 10);
    
    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson("/discover/tv", {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      sort_by: "popularity.desc",
      include_adult: false
    });

    const results = Array.isArray(json.results)
      ? json.results.map(pickTv).filter(Boolean)
      : [];

    const payload = {
      page: json.page ?? 1,
      results,
      totalPages: json.total_pages ?? 0,
      totalResults: json.total_results ?? 0
    };

    cache.set(key, payload);
    res.json(payload);
  })
);

// Trending (all)
// GET /api/trending?page=1
app.get(
  "/api/trending",
  asyncRoute(async (req, res) => {
    const page = Number.parseInt(req.query.page || "1", 10);
    
    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson("/trending/all/week", {
      page: Number.isFinite(page) && page > 0 ? page : 1
    });

    const results = Array.isArray(json.results)
      ? json.results.map(pickSearchResult).filter(Boolean)
      : [];

    const payload = {
      page: json.page ?? 1,
      results,
      totalPages: json.total_pages ?? 0,
      totalResults: json.total_results ?? 0
    };

    cache.set(key, payload);
    res.json(payload);
  })
);


// Movie details
app.get(
  "/api/movie/:id",
  asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson(`/movie/${id}`, { language: req.query.language || "en-US" });
    const payload = pickMovie(json);
    cache.set(key, payload);
    res.json(payload);
  })
);

// TV details
app.get(
  "/api/tv/:id",
  asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson(`/tv/${id}`, { language: req.query.language || "en-US" });
    const payload = pickTv(json);
    cache.set(key, payload);
    res.json(payload);
  })
);

// TV season details
app.get(
  "/api/tv/:id/season/:season",
  asyncRoute(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const season = Number.parseInt(req.params.season, 10);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    if (!Number.isFinite(season) || season <= 0) return res.status(400).json({ error: "Invalid season" });

    const key = cacheKey(req);
    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const json = await tmdbGetJson(`/tv/${id}/season/${season}`, { language: req.query.language || "en-US" });

    const payload = {
      tmdbId: id,
      season: json.season_number ?? season,
      name: json.name || null,
      overview: json.overview || null,
      airDate: json.air_date || null,
      posterPath: json.poster_path || null,
      episodes: Array.isArray(json.episodes)
        ? json.episodes.map((ep) => ({
            episodeNumber: ep.episode_number,
            seasonNumber: ep.season_number,
            name: ep.name || "",
            overview: ep.overview || "",
            airDate: ep.air_date || null,
            runtime: ep.runtime ?? null,
            stillPath: ep.still_path || null
          }))
        : []
    };

    cache.set(key, payload);
    res.json(payload);
  })
);

// Optional: serve the frontend from repo root
if (SERVE_FRONTEND) {
  const frontendRoot = path.join(__dirname, "..", "..");
  app.use(express.static(frontendRoot));

  // SPA-ish fallback to index.html for refreshes
  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendRoot, "index.html"));
  });
}

app.use((err, req, res, next) => {
  const status = err.status && Number.isFinite(err.status) ? err.status : 500;

  // Friendly error when TMDB_API_KEY is missing
  if (err.code === "MISSING_TMDB_KEY") {
    return res.status(500).json({
      error: "TMDB_API_KEY missing",
      hint: "Create backend/.env and set TMDB_API_KEY=..."
    });
  }

  res.status(status).json({
    error: err.message || "Server error",
    status
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log("TMDB wrapper routes:");
  console.log("  GET /api/health");
  console.log("  GET /api/search?query=batman");
  console.log("  GET /api/discover/movie?page=1");
  console.log("  GET /api/discover/tv?page=1");
  console.log("  GET /api/trending?page=1");
  console.log("  GET /api/movie/:id");
  console.log("  GET /api/tv/:id");
  console.log("  GET /api/tv/:id/season/:season");
});
