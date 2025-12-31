import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './MovieCard.css';

export default function MovieCard({ item }) {
  const posterUrl = api.getPosterUrl(item.posterPath);
  const title = item.title || 'Untitled';
  const year = item.year || '';
  const mediaType = item.mediaType || 'movie';

  const watchLink = mediaType === 'tv' 
    ? `/watch/tv/${item.tmdbId}/1/1`
    : `/watch/movie/${item.tmdbId}`;

  return (
    <Link to={watchLink} className="card">
      <img src={posterUrl} alt={title} className="card__image" loading="lazy" />
      <div className="card__content">
        <h3 className="card__title">{title}</h3>
        <div className="card__meta">
          {year && <span>{year}</span>}
          {mediaType === 'tv' && <span> • TV Series</span>}
        </div>
      </div>
    </Link>
  );
}
