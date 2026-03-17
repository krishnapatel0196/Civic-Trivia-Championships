import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthInitializer } from './components/AuthInitializer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkipToContent } from './components/accessibility/SkipToContent';
import { LiveRegions } from './components/accessibility/LiveRegions';
import { ConfettiController } from './components/animations/ConfettiController';
import { useWebVitals } from './hooks/useWebVitals';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Game } from './pages/Game';
import { Profile } from './pages/Profile';
import { Forbidden } from './pages/Forbidden';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionsPage } from './pages/admin/QuestionsPage';
import { CollectionsPage } from './pages/admin/CollectionsPage';
import { FlagReviewPage } from './pages/admin/FlagReviewPage';
import { DuplicateReviewPage } from './pages/admin/DuplicateReviewPage';
import { ElectionsPage } from './pages/admin/ElectionsPage';
import { AdminsPage } from './pages/admin/AdminsPage';
import { Leaderboard } from './pages/Leaderboard';

// AdminGuard component: checks admin_users table (via isAdmin in store)
function AdminGuard() {
  const { isAuthenticated, isLoading, tierResolved, isAdmin } = useAuthStore();

  if (isLoading || !tierResolved) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Forbidden />;

  return <Outlet />;
}

function App() {
  // Monitor Web Vitals in production
  useWebVitals();

  return (
    <BrowserRouter>
      <SkipToContent />
      <LiveRegions />
      <ConfettiController />
      <AuthInitializer>
        <main id="main-content" tabIndex={-1}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/play" element={<Game />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Protected routes — require auth */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin routes — require admin role */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="questions" element={<QuestionsPage />} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="flags" element={<FlagReviewPage />} />
                <Route path="duplicates" element={<DuplicateReviewPage />} />
                <Route path="elections" element={<ElectionsPage />} />
                <Route path="admins" element={<AdminsPage />} />
              </Route>
            </Route>
          </Routes>
        </main>
      </AuthInitializer>
    </BrowserRouter>
  );
}

export default App;
