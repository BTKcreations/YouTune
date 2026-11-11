import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { ArtistPage } from './pages/ArtistPage';
import { GenreExplorer } from './pages/GenreExplorer';
import { GenrePage } from './pages/Genre';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="discover" element={<Discover />} />
        <Route path="search" element={<Search />} />
        <Route path="explore" element={<GenreExplorer />} />
        <Route path="genre/:genreId" element={<GenrePage />} />
        <Route path="library" element={<Library />} />
        <Route path="library/liked" element={<Library />} />
        <Route path="playlist/:id" element={<PlaylistDetail />} />
        <Route path="artist/:id" element={<ArtistPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
