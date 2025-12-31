import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import MovieGrid from '../components/MovieGrid';
import Spinner from '../components/Spinner';
import './Search.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      loadSearchResults();
    }
  }, [query]);

  const loadSearchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.search(query, 1);
      setItems(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">
          Search results for "{query}"
        </h1>
        {!loading && (
          <p className="search-page__count">
            {items.length} result{items.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>
      
      <MovieGrid items={items} loading={loading} error={error} />
    </div>
  );
}
