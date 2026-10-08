import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createQueryClient } from './api/queryClient';
import App from './App';
import './index.css';

const queryClient = createQueryClient();

async function enableMocking() {
  // Mocks are on by default because there is no real backend for this project
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD });
}

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

enableMocking()
  .catch((error: unknown) => console.error('Failed to start the mock API', error))
  .finally(renderApp);
