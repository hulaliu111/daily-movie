// 读取数据，按当天日期确定推荐哪一部，渲染卡片

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function fmtScore(x) {
  return x == null ? "" : Number(x).toFixed(1);
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

// 今天的日期字符串
function todayStr() {
  return localDateStr(new Date());
}

// 从 URL 读取日期，缺省今天
function dateFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get("date") || todayStr();
}

// 日期加减 N 天
function shiftDate(dateStr, delta) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateStr(dt);
}

// 氛围背景：按电影类型给页面换一套色调
const MOODS = [
  { key: "anime",   tags: ["动画"] },
  { key: "romance", tags: ["爱情", "同性", "歌舞", "音乐"] },
  { key: "dark",    tags: ["悬疑", "惊悚", "犯罪", "恐怖"] },
  { key: "scifi",   tags: ["科幻", "奇幻", "冒险"] },
  { key: "action",  tags: ["动作", "战争", "西部"] },
  { key: "happy",   tags: ["喜剧", "家庭", "儿童"] },
  { key: "drama",   tags: ["剧情", "传记", "历史"] },
];

function moodFor(genres) {
  for (const m of MOODS) {
    if ((genres || []).some((g) => m.tags.includes(g))) return m.key;
  }
  return "drama";
}

let currentDate = dateFromUrl();

function render() {
  const m = pickMovie(currentDate);

  // 氛围背景：按电影类型换色调
  document.body.dataset.mood = moodFor(m.genres);

  // 日期 + 「回到今天」按钮
  document.getElementById("date").textContent = currentDate;
  document.getElementById("today-btn").hidden = currentDate === todayStr();

  const genres = (m.genres || []).join(" / ");
  const directors = (m.directors || []).join("、");
  const actors = (m.actors || []).join("、");
  const year = m.year || "";

  // 第二评分：优先烂番茄，否则降级 TMDB
  let secondScoreHtml;
  if (m.rt_tomatometer != null) {
    secondScoreHtml = `<span class="score rt">烂番茄 <b>${m.rt_tomatometer}%</b> <small>新鲜度</small></span>`;
  } else if (m.tmdb_rating != null) {
    secondScoreHtml = `<span class="score tmdb">TMDB <b>${fmtScore(m.tmdb_rating)}</b> <small>观众评分</small></span>`;
  } else {
    secondScoreHtml = `<span class="score tmdb">TMDB <b>待接入</b></span>`;
  }

  // 双评分差异大时，加一句「评价分化」趣味文案
  let diverge = "";
  if (m.douban_rating != null && m.tmdb_rating != null) {
    const diff = m.douban_rating - m.tmdb_rating;
    if (Math.abs(diff) >= 1.5) {
      diverge = diff > 0
        ? `<p class="diverge">📊 评分分化：豆瓣影迷打了 ${m.douban_rating}，海外观众（TMDB）只给 ${fmtScore(m.tmdb_rating)}——这部片国内外的口碑差得挺有意思。</p>`
        : `<p class="diverge">📊 评分分化：海外观众（TMDB）给了 ${fmtScore(m.tmdb_rating)}，比豆瓣的 ${m.douban_rating} 还高——是部被豆瓣低估的好片。</p>`;
    }
  }

  const metaParts = [];
  if (year) metaParts.push(year);
  if (genres) metaParts.push(genres);
  const metaLine = metaParts.join(" · ");

  const posterHtml = m.poster
    ? `<img class="poster-img" src="${esc(m.poster)}" alt="${esc(m.title)} 海报"
         data-title="${esc(m.title)}" data-title-en="${esc(m.title_en)}" onerror="fallbackPoster(this)">`
    : `<span class="poster-title">${esc(m.title)}</span><span class="poster-en">${esc(m.title_en)}</span>`;

  const doubanLink = m.douban_url
    ? `<a class="action-btn" href="${esc(m.douban_url)}" target="_blank" rel="noopener">在豆瓣查看 ↗</a>`
    : "";

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
        ${secondScoreHtml}
      </div>
      ${diverge}
      <p class="reason">${esc(m.reason)}</p>
      <div class="actions">${doubanLink}</div>
      <p class="source-note">数据来源：豆瓣 Top 250 · TMDB</p>
    </div>
  `;
}

// 翻看日期：更新 URL（不刷新页面）并重渲染
function gotoDate(dateStr) {
  currentDate = dateStr;
  const url = new URL(location.href);
  if (dateStr === todayStr()) {
    url.searchParams.delete("date");
  } else {
    url.searchParams.set("date", dateStr);
  }
  history.pushState({}, "", url);
  render();
}

// 绑定翻页按钮
document.getElementById("prev-day").addEventListener("click", function () {
  gotoDate(shiftDate(currentDate, -1));
});
document.getElementById("next-day").addEventListener("click", function () {
  gotoDate(shiftDate(currentDate, 1));
});
document.getElementById("today-btn").addEventListener("click", function () {
  gotoDate(todayStr());
});

// 浏览器前进/后退时同步
window.addEventListener("popstate", function () {
  currentDate = dateFromUrl();
  render();
});

render();
