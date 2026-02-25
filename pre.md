我有一个影视站项目（LibreTV），需要重构为 Cloudflare SaaS 影视平台（无服务器版），并默认集成多个免费影视资源站 API，保证视频可播放、图片可加载、访问速度快，并支持域名：

👉 https://www.132533.xyz

一、目标（必须全部实现）

将项目改造为：

✔ Cloudflare Pages + Workers SaaS 架构
✔ 无服务器（不依赖传统服务器）
✔ 默认可用影视资源
✔ 视频直链可播放
✔ 图片可加载
✔ 国内访问尽量快
✔ 可扩展资源站
✔ 支持后续会员/广告

二、默认内置免费影视资源站 API

在代码中写死以下资源站（默认启用）：

export const VIDEO_SOURCES = [
  {
    key: "ffzy",
    name: "非凡资源",
    api: "https://cj.ffzyapi.com/api.php/provide/vod/",
    type: "m3u8"
  },
  {
    key: "lzm3u8",
    name: "量子资源",
    api: "https://cj.lzm3u8.com/api.php/provide/vod/",
    type: "m3u8"
  },
  {
    key: "yzzy",
    name: "樱花资源",
    api: "https://api.yzzy-api.com/inc/apijson.php",
    type: "m3u8"
  },
  {
    key: "wolong",
    name: "卧龙资源",
    api: "https://wolongzyw.com/api.php/provide/vod/",
    type: "m3u8"
  }
];

要求：

✔ 首页随机展示资源站影片
✔ 支持搜索影片
✔ 支持影片详情
✔ 支持选集播放

三、Cloudflare SaaS 架构

必须改造为：

1️⃣ 前端（Cloudflare Pages）

静态页面：

首页

搜索

分类

播放页

详情页

所有 API 请求走：

/api/*
2️⃣ Workers 代理层（核心）

创建 Workers API：

/functions/api/[...path].js

功能：

✔ 代理影视资源站
✔ 解决跨域
✔ 加速
✔ 统一 API

实现：

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  const resp = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return new Response(resp.body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": resp.headers.get("Content-Type") || "application/json"
    }
  });
}
四、视频播放必须稳定

播放器改为：

✔ hls.js
✔ 原生 m3u8
✔ 自动清晰度

播放器代码：

<video id="player" controls autoplay></video>

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
function play(url) {
  const video = document.getElementById("player");

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }
}
</script>
五、图片加载修复（关键）

所有封面图片必须走 Workers 代理：

export function imgProxy(url){
  return `/api?url=${encodeURIComponent(url)}`
}

页面统一：

<img :src="imgProxy(item.pic)">

确保：

✔ Cloudflare 可缓存
✔ 防盗链
✔ 国内可访问

六、前端资源站聚合层

创建：

/src/lib/sourceManager.js

实现：

import { VIDEO_SOURCES } from "./sources";

export async function searchAll(keyword){
  const results = [];

  for (const s of VIDEO_SOURCES){
    const url = `/api?url=${encodeURIComponent(
      s.api + "?wd=" + keyword
    )}`;

    const r = await fetch(url);
    const j = await r.json();

    if (j.list){
      results.push(...j.list.map(v=>({
        ...v,
        source: s.key
      })));
    }
  }

  return results;
}
七、Cloudflare 部署配置

生成：

wrangler.toml

内容：

name = "libretv-saas"
compatibility_date = "2025-01-01"

[site]
bucket = "./dist"

routes = [
  "www.132533.xyz/*",
  "132533.xyz/*"
]
八、域名绑定

必须支持：

https://www.132533.xyz

Cloudflare Pages：

✔ 绑定域名
✔ 自动 HTTPS
✔ 全球 CDN

九、性能优化（必须）

实现：

✔ Cloudflare CDN 缓存图片
✔ Workers 缓存 API
✔ 首页秒开
✔ 播放不卡

Workers 加缓存：

const cache = caches.default;

let resp = await cache.match(context.request);
if (!resp){
  resp = await fetch(target);
  resp = new Response(resp.body, resp);
  resp.headers.set("Cache-Control", "public, max-age=3600");
  context.waitUntil(cache.put(context.request, resp.clone()));
}
return resp;
十、最终项目结构
LibreTV-SaaS/
│
├─ src/
│  ├─ pages/
│  ├─ components/
│  ├─ lib/
│  │   ├─ sources.js
│  │   ├─ sourceManager.js
│
├─ public/
│
├─ functions/
│  └─ api/
│     └─ [...path].js
│
├─ wrangler.toml
├─ package.json
十一、必须实现功能清单

Cursor 必须保证：

✔ 首页影片展示
✔ 搜索影片
✔ 影片详情
✔ 选集播放
✔ m3u8 播放
✔ 图片正常
✔ 视频正常
✔ 多资源站
✔ Cloudflare 可部署
✔ 132533.xyz 可访问

十二、交付要求

输出完整项目：

✔ 可 npm install
✔ 可 npm run build
✔ 可直接部署 Cloudflare
✔ 默认可看视频