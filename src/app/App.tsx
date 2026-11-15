import { HashRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ProgressProvider } from './ProgressProvider';
import { SpeechProvider } from './SpeechProvider';
import { useTheme } from '../hooks/useTheme';
import type { ProgressStore } from '../services/progressStore';
import type { SpeechEngine } from '../services/speech';
import { HomePage } from '../pages/HomePage';
import { JourneysPage } from '../pages/JourneysPage';
import { JourneyPage } from '../pages/JourneyPage';
import { ModulePage } from '../pages/ModulePage';
import { LessonReaderPage } from '../pages/LessonReaderPage';
import { ReviewPage } from '../pages/ReviewPage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PrintSectionPage } from '../pages/PrintSectionPage';
import { NotFoundPage } from '../pages/NotFoundPage';

function ThemeSync() {
  useTheme();
  return null;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="journeys" element={<JourneysPage />} />
        <Route path="journeys/:journeySlug" element={<JourneyPage />} />
        <Route path="modules/:moduleSlug" element={<ModulePage />} />
        <Route path="learn/:moduleId/:sectionId" element={<LessonReaderPage />} />
        <Route path="learn/:moduleId/:sectionId/:stepId" element={<LessonReaderPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="print/:moduleId/:sectionId" element={<PrintSectionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function AppProviders({
  children,
  store,
  speechEngine,
}: {
  children: ReactNode;
  store?: ProgressStore;
  speechEngine?: SpeechEngine;
}) {
  return (
    <ProgressProvider store={store}>
      <SpeechProvider engine={speechEngine}>
        <ThemeSync />
        {children}
      </SpeechProvider>
    </ProgressProvider>
  );
}

/**
 * Hash routing keeps deep links working after refresh on static hosts such as
 * GitHub Pages, which cannot rewrite unknown paths to index.html.
 */
export function App() {
  return (
    <AppProviders>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProviders>
  );
}
