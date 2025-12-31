const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_ENDPOINT = `${API_BASE}/api`;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const api = {
  async search(query, page = 1) {
    const res = await fetch(`${API_ENDPOINT}/search?query=${encodeURIComponent(query)}&page=${page}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async discoverMovies(page = 1) {
    const res = await fetch(`${API_ENDPOINT}/discover/movie?page=${page}`);
    if (!res.ok) throw new Error('Discover movies failed');
    return res.json();
  },

  async discoverTv(page = 1) {
    const res = await fetch(`${API_ENDPOINT}/discover/tv?page=${page}`);
    if (!res.ok) throw new Error('Discover TV failed');
    return res.json();
  },

  async trending(page = 1) {
    const res = await fetch(`${API_ENDPOINT}/trending?page=${page}`);
    if (!res.ok) throw new Error('Trending failed');
    return res.json();
  },

  async getMovieDetails(id) {
    const res = await fetch(`${API_ENDPOINT}/movie/${id}`);
    if (!res.ok) throw new Error('Movie details failed');
    return res.json();
  },

  async getTvDetails(id) {
    const res = await fetch(`${API_ENDPOINT}/tv/${id}`);
    if (!res.ok) throw new Error('TV details failed');
    return res.json();
  },

  async getTvSeason(id, season) {
    const res = await fetch(`${API_ENDPOINT}/tv/${id}/season/${season}`);
    if (!res.ok) throw new Error('TV season failed');
    return res.json();
  },

  getImageUrl(path, size = 'w500') {
    if (!path) return `https://via.placeholder.com/500x750/333/fff?text=No+Image`;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getPosterUrl(path) {
    return this.getImageUrl(path, 'w342');
  },

  getBackdropUrl(path) {
    return this.getImageUrl(path, 'original');
  }
};

export const buildVidkingUrl = ({ mediaType, tmdbId, season, episode }) => {
  if (!tmdbId) return null;
  
  if (mediaType === 'tv') {
    const s = season || 1;
    const e = episode || 1;
    return `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${e}?autoPlay=true&nextEpisode=true&episodeSelector=true`;
  }
  
  return `https://www.vidking.net/embed/movie/${tmdbId}?autoPlay=true`;
};
