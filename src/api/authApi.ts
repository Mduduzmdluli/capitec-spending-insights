import { apiPost, apiPostNoContent } from './client';
import { sessionSchema } from './schemas';
import type { LoginRequest } from './schemas';

export const authApi = {
  login: (credentials: LoginRequest) => apiPost('/api/auth/login', sessionSchema, credentials),

  logout: (token: string) => apiPostNoContent('/api/auth/logout', { token }),
};
