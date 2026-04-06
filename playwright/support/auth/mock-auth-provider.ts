import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

/**
 * A mock auth provider for framework initialization.
 * Replace this with a real Supabase auth provider later.
 */
const mockAuthProvider: AuthProvider = {
  getEnvironment: (options) => options?.environment || 'local',
  getUserIdentifier: (options) => options?.userIdentifier || 'default',

  extractToken: (storageState) => {
    return 'mock-token';
  },

  extractCookies: (storageState) => {
    return [
      {
        name: 'sb-auth-token',
        value: 'mock-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ];
  },

  isTokenExpired: (rawToken) => {
    return false;
  },

  manageAuthToken: async (request, options) => {
    return {
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
    };
  },

  clearToken: (options) => {
    // Mock implementation
  },
};

export default mockAuthProvider;
