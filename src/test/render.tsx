import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import type { Location } from 'react-router';
import { AuthProvider } from '../auth/AuthProvider';
import { createTestSession } from './session';

type ProviderOptions = {
  /** The URL to start at, e.g. "/?period=90d" */
  route?: string;
  /** Which customer is signed in: defaults to cust_001; null means nobody */
  signedInAs?: string | null;
};

/** Everything the app needs around it: data cache, authentication and routing. */
export function createTestWrapper({ route = '/', signedInAs = 'cust_001' }: ProviderOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const initialSession = signedInAs ? createTestSession(signedInAs) : null;
  const locationRef: { current: Location | null } = { current: null };

  function LocationCapture() {
    locationRef.current = useLocation();
    return null;
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={initialSession}>
          <MemoryRouter initialEntries={[route]}>
            {children}
            <LocationCapture />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return {
    Wrapper,
    queryClient,
    /** The router's current location, for asserting on URL changes */
    getLocation: () => locationRef.current,
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { route, signedInAs, ...options }: Omit<RenderOptions, 'wrapper'> & ProviderOptions = {},
) {
  const { Wrapper, queryClient, getLocation } = createTestWrapper({ route, signedInAs });
  return { queryClient, getLocation, ...render(ui, { wrapper: Wrapper, ...options }) };
}
