import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import type { Location } from 'react-router';

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** The URL to start at, e.g. "/?period=90d" */
  route?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const locationRef: { current: Location | null } = { current: null };

  function LocationCapture() {
    locationRef.current = useLocation();
    return null;
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {children}
          <LocationCapture />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    /** The router's current location, for asserting on URL changes */
    getLocation: () => locationRef.current,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
