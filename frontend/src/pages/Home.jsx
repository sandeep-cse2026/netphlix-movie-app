import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import MovieGrid from '../components/MovieGrid';
import Spinner from '../components/Spinner';
import './Home.css';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    if (trending.length > 0) {
      const interval = setInterval(() => {
        nextSlide();
      }, 6000); // Auto-advance every 6 seconds

      return () => clearInterval(interval);
    }
  }, [trending, currentSlide]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      const data = await api.trending(1);
      setTrending(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (!isTransitioning && trending.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(trending.length, 5));
      }, 300);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  const prevSlide = () => {
    if (!isTransitioning && trending.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5));
      }, 300);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  const goToSlide = (index) => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
      }, 300);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  const heroItems = trending.slice(0, 5);
  const currentHero = heroItems[currentSlide];

  return (
    <div className="home">
      {loading ? (
        <div className="hero hero--loading">
          <Spinner large />
        </div>
      ) : currentHero ? (
        <div className="hero-carousel">
          <div 
            className={`hero ${isTransitioning ? 'hero--transitioning' : ''}`}
            style={{ backgroundImage: `url(${api.getBackdropUrl(currentHero.backdropPath)})` }}
          >
            <div className="hero__content">
              <h1 className="hero__title">{currentHero.title}</h1>
              <p className="hero__subtitle">
                {currentHero.overview?.slice(0, 200)}...
              </p>
              <div className="hero__actions">
                <Link 
                  to={currentHero.mediaType === 'tv' ? `/watch/tv/${currentHero.tmdbId}/1/1` : `/watch/movie/${currentHero.tmdbId}`}
                  className="btn btn--primary"
                >
                  ▶ Play
                </Link>
                <Link to="/browse" className="btn btn--ghost">
                  ⓘ More Info
                </Link>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button className="hero__nav hero__nav--prev" onClick={prevSlide} aria-label="Previous">
              ‹
            </button>
            <button className="hero__nav hero__nav--next" onClick={nextSlide} aria-label="Next">
              ›
            </button>

            {/* Carousel Indicators */}
            <div className="hero__indicators">
              {heroItems.map((_, index) => (
                <button
                  key={index}
                  className={`hero__indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="hero hero--fallback">
          <div className="hero__content">
            <h1 className="hero__title">Welcome to NETPHLIX</h1>
            <p className="hero__subtitle">Discover amazing content from around the world</p>
            <div className="hero__actions">
              <Link to="/browse" className="btn btn--primary">
                Browse Content
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Trending Now</h2>
        </div>
        <MovieGrid items={trending.slice(1, 13)} loading={loading} error={error} />
      </div>
    </div>
  );
}
