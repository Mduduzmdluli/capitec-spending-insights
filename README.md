# Customer Spending Insights Dashboard

Show Image

A responsive financial analytics dashboard that shows a customer's spending: totals and trends over time, a breakdown by category, and a searchable list of transactions. All data is mocked.

## Tech stack

1. React with TypeScript (strict mode), built with Vite
2. TanStack Query for data fetching, caching and loading/error states
3. Zod for validating API responses at runtime
4. MSW (Mock Service Worker) as the mock backend
5. date-fns for date handling
6. Vitest and React Testing Library for tests
7. ESLint and Prettier for code quality
8. Docker with nginx for production serving
9. GitHub Actions for continuous integration

## Prerequisites

To run with Docker (recommended for reviewers):

Docker

To run locally for development:

Node.js 22 or later
npm 10 or later

## Quick start with Docker

bash
git clone https://github.com/YOUR-USERNAME/spending-insights.git
cd spending-insights
docker build -t spending-insights .
docker run --rm -p 8080:8080 spending-insights

Open http://localhost:8080.

If port 8080 is already in use on your machine, map a different one, for example -p 3000:8080, and open http://localhost:3000. The container always listens on 8080 internally.

Press Ctrl+C to stop the container.

## Local development

bash
npm ci
npm run dev

Open http://localhost:5173. The app reloads automatically as you edit files.

## Available scripts

Script What it does

1. npm run dev :Start the development server
2. npm run build :Type-check and build for production into dist/
3. npm run preview :Serve the production build locally
4. npm test :Run all tests once
5. npm run test:watch :Run tests in watch mode while developing
6. npm run test:coverage :Run tests with a coverage report in coverage/
7. npm run lint :Check code with ESLint
8. npm run lint:fix :Fix ESLint issues automatically where possible
9. npm run format :Format all files with Prettier
10. npm run format:check :Check formatting without changing files (used in CI)
11. npm run typecheck :Run the TypeScript compiler without emitting files

## Testing

bash
npm test

Tests run in a simulated browser environment (jsdom) and use the same mock API handlers as the running app, so components and hooks are tested against realistic responses.

To see coverage:

bash
npm run test:coverage
open coverage/index.html

## Mock API

There is no real backend for this project. Instead, MSW intercepts network requests in the browser and responds like a REST API would, including realistic latency, validation errors and not-found responses. Because of this, MSW is deliberately included in the production build.

The data is generated from a fixed seed, so it looks realistic but is the same every time. It covers the last two years for one fictional customer, with everyday spending at South African merchants, monthly debit orders and a monthly salary. Amounts are stored in cents to avoid floating-point rounding errors.

## Endpoints

Method Endpoint Query parameters

1. GET /api/customers/:id
2. GET /api/customers/:id/summary from, to
3. GET /api/customers/:id/spending/trends from, to, interval (day, week, month)
4. GET /api/customers/:id/spending/categories from, to
5. GET /api/customers/:id/transactions from, to, category, q, page, pageSize, sort

Dates use the YYYY-MM-DD format. The mock customer ID is cust_001.

### Previewing error and loading states

Add a query parameter to the app's URL:

1. ?simulate=error makes every API request fail, to show error states
2. ?simulate=slow adds a 3-second delay, to show loading states

For example: http://localhost:8080/?simulate=error

## Connecting a real backend

All requests go through a single typed API client (src/api/client.ts), so switching to a real API only requires two environment variables at build time:

#### Variable Default Purpose

###### VITE_ENABLE_MOCKS true Set to false to disable the mock API

###### VITE_API_BASE_URL same origin Base URL of the real API

These are read when the app is built, so they must be set before npm run build (or passed into the Docker build).

## Project structure

src/
api/ Typed API client, Zod schemas and TanStack Query hooks
components/ Shared UI components
lib/ Helpers such as currency formatting
mocks/ MSW handlers, mock data generator and aggregation logic
test/ Test setup

### Continuous integration

Every push and pull request to main runs a GitHub Actions workflow that:

1. Lints the code and checks formatting
2. Type-checks the project
3. Runs all tests with coverage
4. Builds the Docker image and smoke-tests the running container: the app loads, client-side routes are served correctly, and security headers are present

## Production setup

The Docker image uses a multi-stage build. Node builds the app, and the final image contains only nginx and the static files, running as a non-root user. The nginx configuration adds:

1. Gzip compression
2. Security headers, including a strict Content-Security-Policy
3. Long-term caching for fingerprinted assets, and no caching for index.html so new deployments are picked up immediately
4. A fallback to index.html so client-side routes work on refresh

## Brand assets

The Capitec name and logo are trademarks of Capitec Bank Limited and are used here solely for the purposes of this technical assessment.

## How data flows

Components never call `fetch` directly. Every request follows the same path, so swapping the mock API for a real one only changes the start and end of the chain.

```
Component (e.g. SpendingTrend)
  → TanStack Query hook          src/api/hooks.ts
  → endpoint function            src/api/customerApi.ts
  → apiGet() calls fetch()       src/api/client.ts
      ↓ request intercepted by MSW's service worker
  → request handler              src/mocks/handlers.ts
  → transaction data             src/mocks/db.ts
      generated once from        src/mocks/data/generate.ts
      using merchants, debit
      orders and salary in       src/mocks/data/merchants.ts
  → totals, trends, breakdowns   src/mocks/data/aggregations.ts
      ↓ JSON response
  → validated with Zod           src/api/client.ts
  → rendered by the component
```

The mock data uses a fixed random seed, so it is realistic but identical on every run. Tests use the same handlers through `src/mocks/server.ts`, and individual tests can override a handler with fixed data using `server.use(...)`.

To see requests in action, open the browser's DevTools, go to the Network tab and change the period: each section's request and its JSON response appear just as they would with a real server.
