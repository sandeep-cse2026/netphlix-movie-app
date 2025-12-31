const { fetch } = require("undici");

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

function requireTmdbKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    const err = new Error("TMDB_API_KEY is missing. Add it to backend/.env");
    err.code = "MISSING_TMDB_KEY";
    throw err;
  }
  return key;
}

function buildTmdbUrl(pathname, query = {}) {
  const apiKey = requireTmdbKey();
  const url = new URL(`${TMDB_BASE_URL}${pathname}`);
  url.searchParams.set("api_key", apiKey);

  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  return url;
}

async function tmdbGetJson(pathname, query) {
  const url = buildTmdbUrl(pathname, query);

  const res = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`TMDB request failed: ${res.status}`);
    err.status = res.status;
    err.details = json;
    throw err;
  }

  return json;
}

function pickMovie(m) {
  if (!m) return null;
  return {
    mediaType: "movie",
    tmdbId: m.id,
    title: m.title || "",
    overview: m.overview || "",
    year: (m.release_date || "").slice(0, 4) || null,
    releaseDate: m.release_date || null,
    posterPath: m.poster_path || null,
    backdropPath: m.backdrop_path || null,
    voteAverage: m.vote_average ?? null,
    voteCount: m.vote_count ?? null,
    runtime: m.runtime ?? null,
    genres: Array.isArray(m.genres) ? m.genres.map((g) => ({ id: g.id, name: g.name })) : undefined
  };
}

function pickTv(t) {
  if (!t) return null;
  return {
    mediaType: "tv",
    tmdbId: t.id,
    title: t.name || "",
    overview: t.overview || "",
    year: (t.first_air_date || "").slice(0, 4) || null,
    firstAirDate: t.first_air_date || null,
    posterPath: t.poster_path || null,
    backdropPath: t.backdrop_path || null,
    voteAverage: t.vote_average ?? null,
    voteCount: t.vote_count ?? null,
    numberOfSeasons: t.number_of_seasons ?? null,
    numberOfEpisodes: t.number_of_episodes ?? null,
    genres: Array.isArray(t.genres) ? t.genres.map((g) => ({ id: g.id, name: g.name })) : undefined
  };
}

function pickSearchResult(r) {
  if (!r) return null;
  if (r.media_type === "movie") {
    return {
      mediaType: "movie",
      tmdbId: r.id,
      title: r.title || "",
      overview: r.overview || "",
      year: (r.release_date || "").slice(0, 4) || null,
      posterPath: r.poster_path || null,
      backdropPath: r.backdrop_path || null,
      voteAverage: r.vote_average ?? null
    };
  }

  if (r.media_type === "tv") {
    return {
      mediaType: "tv",
      tmdbId: r.id,
      title: r.name || "",
      overview: r.overview || "",
      year: (r.first_air_date || "").slice(0, 4) || null,
      posterPath: r.poster_path || null,
      backdropPath: r.backdrop_path || null,
      voteAverage: r.vote_average ?? null
    };
  }

  return null;
}

function createMemoryCache({ ttlMs }) {
  const store = new Map();

  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return null;
      }
      return hit.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
  };
}

module.exports = {
  tmdbGetJson,
  pickMovie,
  pickTv,
  pickSearchResult,
  createMemoryCache
};
