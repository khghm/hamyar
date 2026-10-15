import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const SUPABASE_NOT_CONFIGURED =
  'Supabase تنظیم نشده است؛ مقادیر VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY را در .env وارد کنید';

const configured = Boolean(supabaseUrl && supabaseKey);

if (!configured) {
  console.warn(`[supabase] ${SUPABASE_NOT_CONFIGURED}`);
}

/**
 * Stand-in used when the project is not configured. Every call resolves to the
 * shape `supabase-js` returns, with an error instead of a rejected promise, so a
 * missing `.env` degrades to "the panel has no data" rather than a white screen.
 */
function createUnconfiguredClient(): SupabaseClient {
  const errorResult = () => ({ data: null, error: { message: SUPABASE_NOT_CONFIGURED } });
  const builder = new Proxy({} as Record<string, unknown>, {
    get: () => () => builder,
  });

  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => errorResult(),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
      error: null,
    }),
    signInWithPassword: async () => errorResult(),
    signUp: async () => errorResult(),
    signOut: async () => ({ error: null }),
    updateUser: async () => errorResult(),
    resetPasswordForEmail: async () => errorResult(),
  };

  return new Proxy({ auth } as unknown as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // from() / rpc() / storage / channel …
      return () => builder;
    },
  }) as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = configured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Tokens are persisted in localStorage by default; we use the PKCE flow
        // that Supabase JS manages automatically.
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        // We never rely on the URL fragment for the session — the app uses the
        // default PKCE flow and stores the tokens in localStorage.
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-app-version': '1.0.0',
        },
      },
    })
  : createUnconfiguredClient();

export type {
  AuthError,
  Session,
  User,
} from '@supabase/supabase-js';
