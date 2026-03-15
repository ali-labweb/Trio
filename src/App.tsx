import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MobileShell from './components/layout/MobileShell';
import HomePage from './pages/HomePage';
import TripPage from './pages/TripPage';
import TodayPage from './pages/TodayPage';
import SharedTripPage from './pages/SharedTripPage';
import { useThemeStore } from './store/useThemeStore';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useThemeStore((s) => s.dark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<MobileShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/trip/:tripId" element={<TripPage />} />
            <Route path="/today" element={<TodayPage />} />
          </Route>
          <Route path="/shared" element={<SharedTripPage />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
