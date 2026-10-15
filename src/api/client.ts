import type { z } from 'zod';

/** The server responded with an error status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** The server responded, but the data didn't match the expected shape. */
export class InvalidResponseError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(issues: z.core.$ZodIssue[]) {
    super('Received an unexpected response from the server');
    this.name = 'InvalidResponseError';
    this.issues = issues;
  }
}

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

type QueryParams = Record<string, string | number | undefined>;

export type RequestOptions = {
  /** Sent as "Authorization: Bearer <token>" */
  token?: string;
  signal?: AbortSignal;
};

function buildUrl(path: string, params: QueryParams = {}): URL {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
}

/** Sends a request, adding standard headers, and turns error statuses into an ApiError. */
async function send(url: URL, init: RequestInit, { token, signal }: RequestOptions) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers, signal });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return response;
}

/** Checks the response body against the schema before anything uses it. */
async function parse<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new InvalidResponseError(result.error.issues);
  return result.data;
}

export async function apiGet<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  params: QueryParams = {},
  options: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  const response = await send(buildUrl(path, params), { method: 'GET' }, options);
  return parse(response, schema);
}

export async function apiPost<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  body: unknown,
  options: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  const response = await send(
    buildUrl(path),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    options,
  );
  return parse(response, schema);
}

/** For endpoints that reply with no content, such as signing out. */
export async function apiPostNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  await send(buildUrl(path), { method: 'POST' }, options);
}

/** A message that is safe and helpful to show to the customer. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof InvalidResponseError) return error.message;
  return 'Please check your connection and try again.';
}
