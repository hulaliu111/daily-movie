// 读取数据，按当天日期确定推荐哪一部，渲染卡片

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// 海报加载失败时，回退为占位色块
function fallbackPoster(img) {
  const poster = img.closest(".poster");
  const title = img.dataset.title || "";
  const en = img.dataset.titleEn || "";
  poster.innerHTML =
    '<span class="poster-title">' + esc(title) + "</span>" +
    '<span class="poster-en">' + esc(en) + "</span>";
}

// 本地日期字符串，如 2026-08-25
function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 把字符串变成一个稳定数字（同一天永远得到同一个数）
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// 按日期选片：日期 -> 数字 -> 片库里的某一部
function pickMovie(dateStr) {
  return MOVIES[hashStr(dateStr) % MOVIES.length];
}

function render() {
  const params = new URLSearchParams(location.search);
  const dateStr = params.get("date") || localDateStr(new Date());
  const m = pickMovie(dateStr);

  document.getElementById("date").textContent = dateStr;

  const genres = (m.genres || []).join(" / ");
  const directors = (m.directors || []).join("、");
  const actors = (m.actors || []).join("、");
  const year = m.year || "";

  const rtScore = m.rt_tomatometer != null ? m.rt_tomatometer + "%" : "待接入";

  const metaParts = [];
  if (year) metaParts.push(year);
  if (genres) metaParts.push(genres);
  const metaLine = metaParts.join(" · ");

  const posterHtml = m.poster
    ? `<img class="poster-img" src="${esc(m.poster)}" alt="${esc(m.title)} 海报"
         data-title="${esc(m.title)}" data-title-en="${esc(m.title_en)}" onerror="fallbackPoster(this)">`
    : `<span class="poster-title">${esc(m.title)}</span><span class="poster-en">${esc(m.title_en)}</span>`;

  document.getElementById("card").innerHTML = `
    <div class="poster" aria-hidden="true">${posterHtml}</div>
    <div class="info">
      <h2 class="movie-title">${esc(m.title)}</h2>
      <p class="movie-title-en">${esc(m.title_en)}</p>
      ${metaLine ? `<p class="meta">${esc(metaLine)}</p>` : ""}
      ${directors ? `<p class="meta">导演：${esc(directors)}</p>` : ""}
      ${actors ? `<p class="meta">主演：${esc(actors)}</p>` : ""}
      <div class="scores">
        <span class="score douban">豆瓣 <b>${m.douban_rating}</b> <small>${esc(m.douban_votes || "")}</small></span>
        <span class="score rt">烂番茄 <b>${rtScore}</b> <small>新鲜度</small></span>
      </div>
      <p class="reason">${esc(m.reason)}</p>
      <p class="source-note">数据来源：豆瓣 Top 250 · 烂番茄 Top 100</p>
    </div>
  `;
}

render();
