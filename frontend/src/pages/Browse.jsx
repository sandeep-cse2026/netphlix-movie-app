import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flame, Film, Tv } from 'lucide-react';
import { api } from '../services/api';
import MovieGrid from '../components/MovieGrid';
import Spinner from '../components/Spinner';
import './Browse.css';

export default function Browse() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(type || 'all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    setFilter(type || 'all');
    setPage(1);
    setItems([]);
    loadContent(type || 'all', 1);
  }, [type]);

  const loadContent = useCallback(async (filterType, pageNum) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      let data;
      
      if (filterType === 'movies') {
        data = await api.discoverMovies(pageNum);
      } else if (filterType === 'tv') {
        data = await api.discoverTv(pageNum);
      } else {
        data = await api.trending(pageNum);
      }
      
      if (pageNum === 1) {
        setItems(data.results || []);
      } else {
        setItems(prev => [...prev, ...(data.results || [])]);
      }
      setTotalPages(data.totalPages || data.total_pages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingMore && !loading && page < totalPages) {
          loadContent(filter, page + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [filter, page, totalPages, loadingMore, loading, loadContent]);

  const handleFilterChange = (newFilter) => {
    if (newFilter === 'all') {
      navigate('/browse');
    } else {
      navigate(`/browse/${newFilter}`);
    }
  };

  const handleSearch = async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.search(searchTerm, 1);
      setItems(data.results || []);
      setTotalPages(data.totalPages || data.total_pages || 1);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="browse">
      <div className="toolbar">
        <h2 className="section__title">Browse</h2>
        <div className="chips">
          <button 
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <Flame className="chip__icon" size={18} />
            Trending
          </button>
          <button 
            className={`chip ${filter === 'movies' ? 'active' : ''}`}
            onClick={() => handleFilterChange('movies')}
          >
            <Film className="chip__icon" size={18} />
            Movies
          </button>
          <button 
            className={`chip ${filter === 'tv' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tv')}
          >
            <Tv className="chip__icon" size={18} />
            TV Shows
          </button>
        </div>
        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
          {!loading && `${items.length} results`}
        </div>
      </div>
      
      <MovieGrid items={items} loading={loading} error={error} />
      
      <div ref={observerTarget} className="load-more-trigger">
        {loadingMore && (
          <div className="loading-more">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
}
