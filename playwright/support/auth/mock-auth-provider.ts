import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

/**
 * A mock auth provider for framework initialization.
 * Replace this with a real Supabase auth provider later.
 *
 * NOTE: AuthOptions is `Partial<AuthOptions> | undefined`, so every accessor
 * must guard against `options` being undefined entirely.
 */
const mockAuthProvider: AuthProvider = {
  getEnvironment: (options) => options?.environment ?? 'local',
  getUserIdentifier: (options) => options?.userIdentifier ?? 'default',

  extractToken: () => 'mock-token',

  extractCookies: () => [
    {
      name: 'sb-auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ],

  isTokenExpired: () => false,

  manageAuthToken: async () => ({
    cookies: [
      {
        name: 'sb-auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ],
    origins: [],
  }),

  clearToken: () => {
    // Mock provider — nothing to clear.
  },
};

export default mockAuthProvider;
