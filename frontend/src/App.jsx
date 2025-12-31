import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Watch from './pages/Watch';
import Search from './pages/Search';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="app">
      <Header onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:type" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watch/:mediaType/:tmdbId" element={<Watch />} />
        <Route path="/watch/:mediaType/:tmdbId/:season/:episode" element={<Watch />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
