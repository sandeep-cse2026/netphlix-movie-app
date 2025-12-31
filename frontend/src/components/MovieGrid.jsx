import MovieCard from './MovieCard';
import { SkeletonGrid } from './SkeletonCard';
import './MovieGrid.css';

export default function MovieGrid({ items, loading, error }) {
  if (loading) {
    return <SkeletonGrid count={12} />;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="loading">No results found</div>;
  }

  return (
    <div className="grid">
      {items.map((item) => (
        <MovieCard key={`${item.mediaType}-${item.tmdbId}`} item={item} />
      ))}
    </div>
  );
}
