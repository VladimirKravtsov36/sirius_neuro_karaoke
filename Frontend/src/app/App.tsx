import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import Song from './pages/Song';
import ErrorPage from './pages/Error';
import {LoadingPage} from './pages/LoadingPage';

export default function App() {
  return (
    <Routes>
      {/* Страницы с Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/error" element={<ErrorPage />} />
      </Route>

      {/* Страницы без Layout */}
      <Route path="/song" element={<Song />} />
      <Route path="/loading" element={<LoadingPage />} />
    </Routes>
  );
}
