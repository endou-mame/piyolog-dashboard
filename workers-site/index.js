import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

/**
 * Cloudflare Workers Site entry point for Piyolog Dashboard SPA
 * Serves static assets from the dist/ folder with SPA routing support
 */

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const url = new URL(event.request.url)

  try {
    // Serve static assets from KV
    const options = {
      // Cache static assets in browser
      cacheControl: {
        bypassCache: false,
      },
      // For SPA routing: serve index.html for non-asset paths
      mapRequestToAsset: (req) => {
        const parsedUrl = new URL(req.url)
        const pathname = parsedUrl.pathname

        // If requesting an asset (has file extension), serve it directly
        if (pathname.match(/\.[a-zA-Z0-9]+$/)) {
          return req
        }

        // Otherwise, serve index.html for SPA routing
        parsedUrl.pathname = '/index.html'
        return new Request(parsedUrl.toString(), req)
      },
    }

    return await getAssetFromKV(event, options)
  } catch (e) {
    // If asset not found, return 404 with index.html for SPA fallback
    try {
      const notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req),
      })

      return new Response(notFoundResponse.body, {
        ...notFoundResponse,
        status: 200,
      })
    } catch (e) {
      // If index.html also fails, return simple error
      return new Response('Not Found', { status: 404 })
    }
  }
}
