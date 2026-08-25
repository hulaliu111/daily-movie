// 阶段1：读取数据，按当天日期确定推荐哪一部，渲染卡片

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
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

  document.getElementById("card").innerHTML = `
    <div class="poster" aria-hidden="true">
      <span class="poster-title">${esc(m.title)}</span>
      <span class="poster-en">${esc(m.title_en)}</span>
    </div>
    <div class="info">
      <h2 class="movie-title">${esc(m.title)}</h2>
      <p class="movie-title-en">${esc(m.title_en)}</p>
      <p class="meta">${m.year} · ${m.genres.map(esc).join(" / ")}</p>
      <p class="meta">导演：${m.directors.map(esc).join("、")}</p>
      <p class="meta">主演：${m.actors.map(esc).join("、")}</p>
      <div class="scores">
        <span class="score douban">豆瓣 <b>${m.douban_rating}</b> <small>${esc(m.douban_votes)}</small></span>
        <span class="score rt">烂番茄 <b>${m.rt_tomatometer}%</b> <small>新鲜度</small></span>
      </div>
      <p class="reason">${esc(m.reason)}</p>
      <p class="source-note">数据来源：豆瓣 Top 250 · 烂番茄 Top 100</p>
    </div>
  `;
}

render();
