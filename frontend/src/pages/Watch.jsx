import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { buildVidkingUrl, api } from '../services/api';
import Spinner from '../components/Spinner';
import './Watch.css';

export default function Watch() {
  const { mediaType, tmdbId, season, episode } = useParams();
  const [details, setDetails] = useState(null);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  // Create a unique key for this content
  const getStorageKey = () => {
    if (mediaType === 'tv') {
      return `watch_progress_tv_${tmdbId}_s${season}_e${episode}`;
    }
    return `watch_progress_movie_${tmdbId}`;
  };

  // Save progress to localStorage
  const saveProgress = (currentTime) => {
    const progressData = {
      time: currentTime,
      timestamp: Date.now(),
      mediaType,
      tmdbId,
      season: season || null,
      episode: episode || null
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(progressData));
  };

  // Get saved progress
  const getSavedProgress = () => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const data = JSON.parse(saved);
        // Only return progress if it's less than 7 days old
        const daysSinceWatch = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceWatch < 7) {
          return data.time;
        }
      }
    } catch (error) {
      console.error('Error reading saved progress:', error);
    }
    return 0;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        if (mediaType === 'tv') {
          const [tvData, seasonData] = await Promise.all([
            api.getTvDetails(tmdbId),
            season ? api.getTvSeason(tmdbId, season) : Promise.resolve(null)
          ]);
          setDetails(tvData);
          setSeasonDetails(seasonData);
        } else {
          const movieData = await api.getMovieDetails(tmdbId);
          setDetails(movieData);
        }
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [mediaType, tmdbId, season]);

  // Setup message listener for iframe communication
  useEffect(() => {
    const handleMessage = (event) => {
      // Listen for time updates from the iframe player (if supported)
      if (event.data && event.data.type === 'timeupdate') {
        saveProgress(event.data.currentTime);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Save progress every 30 seconds as a fallback
    const interval = setInterval(() => {
      // This is a fallback; actual time tracking would require player API support
      const savedTime = getSavedProgress();
      if (savedTime > 0) {
        saveProgress(savedTime + 30);
      }
    }, 30000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [mediaType, tmdbId, season, episode]);

  const playerUrl = buildVidkingUrl({
    mediaType,
    tmdbId: parseInt(tmdbId),
    season: season ? parseInt(season) : 1,
    episode: episode ? parseInt(episode) : 1
  });

  // Add timestamp parameter to URL for resume functionality
  const savedTime = getSavedProgress();
  const playerUrlWithTime = savedTime > 10 
    ? `${playerUrl}&t=${Math.floor(savedTime)}` 
    : playerUrl;

  if (!playerUrl) {
    return <div className="error">Invalid video parameters</div>;
  }

  const currentEpisode = seasonDetails?.episodes?.find(
    ep => ep.episode_number === parseInt(episode)
  );

  return (
    <div className="watch">
      {savedTime > 10 && (
        <div className="watch__resume-notice">
          Resuming from {Math.floor(savedTime / 60)}:{String(Math.floor(savedTime % 60)).padStart(2, '0')}
        </div>
      )}
      <div className="player-container">
        <iframe
          ref={iframeRef}
          src={playerUrlWithTime}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          title="Video Player"
        />
      </div>
      
      <div className="watch__info">
        {loading ? (
          <div className="watch__loading">
            <Spinner />
          </div>
        ) : details ? (
          <>
            <div className="watch__header">
              <div className="watch__main">
                <h1 className="watch__title">
                  {details.title || details.name}
                  {mediaType === 'tv' && season && episode && 
                    ` • S${season}E${episode}`
                  }
                </h1>
                {currentEpisode && (
                  <h2 className="watch__episode-title">{currentEpisode.name}</h2>
                )}
                <div className="watch__meta">
                  <span className="watch__meta-item">
                    {mediaType === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  {details.release_date && (
                    <span className="watch__meta-item">
                      {new Date(details.release_date).getFullYear()}
                    </span>
                  )}
                  {details.first_air_date && (
                    <span className="watch__meta-item">
                      {new Date(details.first_air_date).getFullYear()}
                    </span>
                  )}
                  {details.vote_average > 0 && (
                    <span className="watch__meta-item watch__rating">
                      ⭐ {details.vote_average.toFixed(1)}
                    </span>
                  )}
                  {details.runtime && (
                    <span className="watch__meta-item">
                      {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                    </span>
                  )}
                  {details.number_of_seasons && (
                    <span className="watch__meta-item">
                      {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {details.genres && details.genres.length > 0 && (
                  <div className="watch__genres">
                    {details.genres.map(genre => (
                      <span key={genre.id} className="watch__genre">{genre.name}</span>
                    ))}
                  </div>
                )}
              </div>
              {details.poster_path && (
                <div className="watch__poster">
                  <img 
                    src={api.getPosterUrl(details.poster_path)} 
                    alt={details.title || details.name}
                  />
                </div>
              )}
            </div>

            <div className="watch__details">
              {(details.overview || currentEpisode?.overview) && (
                <div className="watch__section">
                  <h3 className="watch__section-title">Overview</h3>
                  <p className="watch__overview">
                    {currentEpisode?.overview || details.overview}
                  </p>
                </div>
              )}

              {details.created_by && details.created_by.length > 0 && (
                <div className="watch__section">
                  <h3 className="watch__section-title">Created By</h3>
                  <p className="watch__text">
                    {details.created_by.map(c => c.name).join(', ')}
                  </p>
                </div>
              )}

              {details.production_companies && details.production_companies.length > 0 && (
                <div className="watch__section">
                  <h3 className="watch__section-title">Production</h3>
                  <p className="watch__text">
                    {details.production_companies.map(c => c.name).join(', ')}
                  </p>
                </div>
              )}

              {seasonDetails && seasonDetails.episodes && (
                <div className="watch__section">
                  <h3 className="watch__section-title">
                    Season {season} Episodes ({seasonDetails.episodes.length})
                  </h3>
                  <div className="watch__episodes">
                    {seasonDetails.episodes.map(ep => (
                      <div 
                        key={ep.id} 
                        className={`watch__episode-card ${
                          parseInt(episode) === ep.episode_number ? 'active' : ''
                        }`}
                      >
                        {ep.still_path && (
                          <img 
                            src={api.getImageUrl(ep.still_path, 'w300')}
                            alt={ep.name}
                            className="watch__episode-thumbnail"
                          />
                        )}
                        <div className="watch__episode-info">
                          <div className="watch__episode-number">
                            Episode {ep.episode_number}
                          </div>
                          <div className="watch__episode-name">{ep.name}</div>
                          {ep.runtime && (
                            <div className="watch__episode-runtime">{ep.runtime}m</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="watch__title">Now Playing</h1>
            <p className="watch__meta">
              {mediaType === 'tv' 
                ? `TV Series • TMDB ${tmdbId} • S${season}E${episode}`
                : `Movie • TMDB ${tmdbId}`
              }
            </p>
          </>
        )}
      </div>
    </div>
  );
}
