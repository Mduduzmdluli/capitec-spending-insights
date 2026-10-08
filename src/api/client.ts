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

export async function apiGet<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<z.infer<TSchema>> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  const result = schema.safeParse(await response.json());
  if (!result.success) throw new InvalidResponseError(result.error.issues);
  return result.data;
}
