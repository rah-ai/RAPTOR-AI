import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import GlobalAlertBanner from './components/shared/GlobalAlertBanner';
import './index.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <GlobalAlertBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/dashboard/:icao" element={<Dashboard theme={theme} toggleTheme={toggleTheme} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
