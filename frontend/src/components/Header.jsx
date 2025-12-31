import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './Header.css';

export default function Header({ onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        try {
          setSearchLoading(true);
          const data = await api.search(searchTerm, 1);
          setSuggestions(data.results?.slice(0, 8) || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Search failed:', err);
          setSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    const watchLink = item.mediaType === 'tv' 
      ? `/watch/tv/${item.tmdbId}/1/1`
      : `/watch/movie/${item.tmdbId}`;
    navigate(watchLink);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header__inner">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" className="brand">NETPHLIX</Link>
          <nav className="nav">
            <Link 
              to="/" 
              className={`nav__link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/browse/movies" 
              className={`nav__link ${location.pathname === '/browse/movies' ? 'active' : ''}`}
            >
              Movies
            </Link>
            <Link 
              to="/browse/tv" 
              className={`nav__link ${location.pathname === '/browse/tv' ? 'active' : ''}`}
            >
              TV Shows
            </Link>
            <Link 
              to="/browse" 
              className={`nav__link ${location.pathname === '/browse' && !location.pathname.includes('/movies') && !location.pathname.includes('/tv') ? 'active' : ''}`}
            >
              New & Popular
            </Link>
          </nav>
        </div>

        <div className="search-container" ref={searchRef}>
          <form className="search" onSubmit={handleSubmit}>
            <input 
              type="search" 
              className="search__input" 
              placeholder="Titles, people, genres"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search__clear"
                onClick={handleClear}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
          
          {showSuggestions && (
            <div className="search-suggestions">
              {searchLoading ? (
                <div className="search-suggestion-loading">
                  <div className="search-spinner"></div>
                  <span>Searching...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <div 
                    key={`${item.mediaType}-${item.tmdbId}`}
                    className="search-suggestion"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <img 
                      src={api.getPosterUrl(item.posterPath)} 
                      alt={item.title}
                      className="search-suggestion__image"
                    />
                    <div className="search-suggestion__info">
                      <div className="search-suggestion__title">{item.title}</div>
                      <div className="search-suggestion__meta">
                        {item.year} • {item.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-suggestion-loading">
                  <span>No results found</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
