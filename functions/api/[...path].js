export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  const cache = caches.default;
  let response;

  // 仅对 GET 请求做缓存
  if (request.method === "GET") {
    const cacheKey = new Request(request.url, request);
    response = await cache.match(cacheKey);
    if (response) {
      return response;
    }
  }

  const upstream = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  // 包装响应，追加 CORS 和缓存头
  response = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });

  if (request.method === "GET") {
    const cacheKey = new Request(request.url, request);
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

