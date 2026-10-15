import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './components/AppShell/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LoginPage } from './features/login/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />
      {/* Unknown addresses go to the dashboard, which asks for sign-in if needed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
