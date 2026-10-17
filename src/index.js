export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve static assets from the `dist` directory via the Assets binding
    if (env.ASSETS) {
      try {
        const asset = await env.ASSETS.get(url.pathname);
        if (asset) {
          return new Response(asset.body, {
            status: 200,
            headers: {
              "content-type": asset.contentType || "application/octet-stream",
              "cache-control": "public, max-age=3600",
            },
          });
        }
      } catch (e) {
        // fall through to index.html for SPA routing
      }
    }

    // Fallback to index.html for client-side routing (React Router)
    try {
      const html = await env.ASSETS.get("/index.html");
      if (html) {
        return new Response(html.body, {
          status: 200,
          headers: { "content-type": "text/html;charset=UTF-8" },
        });
      }
    } catch (e) {
      // ignore
    }

    return new Response("Not found", { status: 404 });
  },
};