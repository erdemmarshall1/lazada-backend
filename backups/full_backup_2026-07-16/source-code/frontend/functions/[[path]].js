const BACKEND_URL = 'https://supportive-delight-production-b90c.up.railway.app'

const PROXY_PREFIXES = ['/home/', '/uploads/']
const ADMIN_PREFIX = '/admin/'
const ASSET_EXTS = new Set([
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.json', '.webmanifest', '.xml', '.txt',
  '.map', '.mjs',
])

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  if (PROXY_PREFIXES.some(p => path.startsWith(p))) {
    return proxyRequest(url, request)
  }

  if (path.startsWith(ADMIN_PREFIX) || path === '/admin') {
    return env.ASSETS.fetch(new URL('/index.html', url).toString())
  }

  if (path.startsWith('/seller')) {
    return Response.redirect(new URL('/', url).toString(), 302)
  }

  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  if (ASSET_EXTS.has(ext)) {
    return env.ASSETS.fetch(request)
  }

  return env.ASSETS.fetch(new URL('/index.html', url).toString())
}

async function proxyRequest(url, request) {
  const targetUrl = BACKEND_URL + url.pathname + url.search
  const headers = new Headers(request.headers)
  headers.set('Host', new URL(BACKEND_URL).host)
  headers.set('Origin', BACKEND_URL)

  const init = { method: request.method, headers }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
  }

  try {
    const response = await fetch(targetUrl, init)
    const respHeaders = new Headers(response.headers)
    respHeaders.set('Access-Control-Allow-Origin', '*')
    respHeaders.set('Access-Control-Allow-Credentials', 'true')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    })
  } catch (err) {
    return new Response(JSON.stringify({ code: -1, message: 'Proxy error: ' + err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
