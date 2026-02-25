import { VIDEO_SOURCES } from "./sources.js";

// 简单的聚合搜索实现，直接串行请求四个内置资源站
export async function searchAll(keyword) {
  const results = [];

  for (const s of VIDEO_SOURCES) {
    const url = `/api?url=${encodeURIComponent(
      s.api + "?wd=" + encodeURIComponent(keyword)
    )}`;

    try {
      const r = await fetch(url);
      const j = await r.json();

      if (j.list) {
        results.push(
          ...j.list.map((v) => ({
            ...v,
            source: s.key,
          }))
        );
      }
    } catch (e) {
      // 单个源失败时忽略，继续下一个
      console.error(`Search from source ${s.key} failed`, e);
    }
  }

  return results;
}

