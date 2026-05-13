import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Sessions from '@/pages/Sessions';
import LoadPerformance from '@/pages/LoadPerformance';
import Analyses from '@/pages/Analyses';
import Settings from '@/pages/Settings';
import AppLayout from '@/components/layout/AppLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-app-muted">Chargement…</div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="entrainements" element={<Sessions />} />
        <Route path="charge-performance" element={<LoadPerformance />} />
        <Route path="analyses" element={<Analyses />} />
        <Route path="parametres" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
