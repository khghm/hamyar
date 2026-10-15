// Shared CORS handling for every Edge Function.
//
// A browser call to a function is a cross-origin request that carries an
// Authorization header, so it triggers a preflight. Without the full header set
// below the preflight fails and the actual request is never sent — which looks
// like a broken function even though the SQL is fine.
//
// `_shared` is not a routable function directory; Supabase only serves the
// per-function folders.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Answers a preflight request. */
export function preflight(req: Request): Response {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  throw new Error('preflight() called for a non-OPTIONS request');
}

/** JSON response that always carries the CORS headers, including on errors. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}