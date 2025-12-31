import './SkeletonCard.css';

export default function SkeletonCard() {
  return <div className="skeleton-card"></div>;
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
