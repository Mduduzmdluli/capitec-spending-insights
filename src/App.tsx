import { AppShell } from './components/AppShell/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';

export default function App() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
