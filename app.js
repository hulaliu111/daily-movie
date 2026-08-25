// 读取数据，按当天日期确定推荐哪一部，渲染卡片

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function fmtScore(x) {
  return x == null ? "" : Number(x).toFixed(1);
}

// 评分星级：满分 10 换算成 5 星的填充百分比
function starsHtml(score10) {
  if (score10 == null) return "";
  const pct = Math.max(0, Math.min(100, (score10 / 10) * 100));
  return '<span class="stars"><span class="stars-fill" style="width:' + pct + '%"></span></span>';
}

// 把导演/演员名字列表变成可点击的链接（用「、」分隔）
function personLinks(names) {
  return (names || []).map(function (n, i) {
    return (i > 0 ? "、" : "") +
      '<button class="person-link" data-person="' + esc(n) + '" type="button">' + esc(n) + '</button>';
  }).join("");
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

// 氛围背景：按电影类型给页面换一套色调（顺序即优先级）
const MOODS = [
  { key: "anime",   tags: ["动画"] },
  { key: "romance", tags: ["爱情", "同性", "歌舞", "音乐"] },
  { key: "dark",    tags: ["悬疑", "惊悚", "犯罪", "恐怖"] },
  { key: "scifi",   tags: ["科幻", "奇幻", "冒险"] },
  { key: "action",  tags: ["动作", "战争", "西部"] },
  { key: "happy",   tags: ["喜剧", "家庭", "儿童"] },
  { key: "drama",   tags: ["剧情", "传记", "历史"] },
];

// 每个氛围主题对应的颜色（供分享图 Canvas 使用，与 style.css 保持一致）
const MOOD_COLORS = {
  anime:   { glow: "#22332a", accent: "#7bd88f" },
  romance: { glow: "#3a2730", accent: "#f08a9b" },
  dark:    { glow: "#2e1d20", accent: "#e0665a" },
  scifi:   { glow: "#292a44", accent: "#8b7bf0" },
  action:  { glow: "#33241a", accent: "#f07b4b" },
  happy:   { glow: "#3a3323", accent: "#f0c86b" },
  drama:   { glow: "#23263a", accent: "#e6b85c" },
};

function moodFor(genres) {
  for (const m of MOODS) {
    if ((genres || []).some((g) => m.tags.includes(g))) return m.key;
  }
  return "drama";
}

let currentDate = dateFromUrl();

// 生成一张电影卡片的 HTML（今日卡片和随机卡片共用）
function movieCardHtml(m, withShare) {
  const genres = (m.genres || []).join(" / ");
  const year = m.year || "";

  // 第二评分：优先烂番茄，否则降级 TMDB
  let secondScoreHtml;
  if (m.rt_tomatometer != null) {
    secondScoreHtml = `<span class="score rt">烂番茄 <b>${m.rt_tomatometer}%</b> <small>新鲜度</small></span>`;
  } else if (m.tmdb_rating != null) {
    secondScoreHtml = `<span class="score tmdb">TMDB <b>${fmtScore(m.tmdb_rating)}</b>${starsHtml(m.tmdb_rating)} <small>观众评分</small></span>`;
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

  const trailerUrl = "https://search.bilibili.com/all?keyword=" +
    encodeURIComponent(m.title + " 预告片");
  const doubanLink = m.douban_url
    ? `<a class="action-btn primary" href="${esc(m.douban_url)}" target="_blank" rel="noopener">在豆瓣查看 ↗</a>`
    : "";
  const trailerLink = `<a class="action-btn" href="${esc(trailerUrl)}" target="_blank" rel="noopener">看预告片 ▶</a>`;
  const resourceLink = `<a class="action-btn" href="https://quanpan.xyz/?q=${encodeURIComponent(m.title)}" target="_blank" rel="noopener">资源搜索</a>`;
  const shareButtons = withShare
    ? `<button class="action-btn" id="copy-btn" type="button">复制推荐</button>
       <button class="action-btn" id="share-btn" type="button">生成分享图</button>`
    : "";

  const bgHtml = m.poster
    ? `<div class="card-bg" style="background-image:url('${esc(m.poster)}')"></div>`
    : "";

  return `
    ${bgHtml}
    <div class="poster" aria-hidden="true">${posterHtml}</div>
    <div class="info">
      <h2 class="movie-title">${esc(m.title)}</h2>
      <p class="movie-title-en">${esc(m.title_en)}</p>
      ${metaLine ? `<p class="meta">${esc(metaLine)}</p>` : ""}
      ${m.directors && m.directors.length ? `<p class="meta">导演：${personLinks(m.directors)}</p>` : ""}
      ${m.actors && m.actors.length ? `<p class="meta">主演：${personLinks(m.actors)}</p>` : ""}
      <div class="scores">
        <span class="score douban">豆瓣 <b>${fmtScore(m.douban_rating)}</b>${starsHtml(m.douban_rating)} <small>${esc(m.douban_votes || "")}</small></span>
        ${secondScoreHtml}
      </div>
      ${diverge}
      <p class="reason">${esc(m.reason)}</p>
      <div class="actions">
        ${doubanLink}
        ${trailerLink}
        ${resourceLink}
        ${shareButtons}
      </div>
      <p class="source-note">数据来源：豆瓣 Top 250 · TMDB</p>
    </div>
  `;
}

// 渲染今日推荐卡片
function render() {
  const m = pickMovie(currentDate);

  // 氛围背景：按电影类型换色调
  document.body.dataset.mood = moodFor(m.genres);

  // 换片时收起合集面板
  document.getElementById("collection").hidden = true;

  // 日期 + 「回到今天」按钮
  document.getElementById("date").textContent = currentDate;
  document.getElementById("today-btn").hidden = currentDate === todayStr();

  const card = document.getElementById("card");
  card.innerHTML = movieCardHtml(m, true);
  card.classList.remove("animate");
  void card.offsetWidth; // 强制重排，让动画每次翻页都能重新触发
  card.classList.add("animate");

  // 动态按钮事件（每次 render 重建 DOM，需重新绑定）
  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) copyBtn.addEventListener("click", function () { copyRecommend(m); });
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) shareBtn.addEventListener("click", function () { generateShareCard(m); });
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

// —— 随机多档推荐 ——
function parseVotes(s) {
  const n = String(s || "").replace(/[^0-9]/g, "");
  return n ? parseInt(n, 10) : 0;
}

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 随便来一部
function randomAny() {
  return randomPick(MOVIES);
}

// 冷门佳作：高分（≥8.8）但评价人数少（<60万）
function randomCold() {
  const cold = MOVIES.filter(function (m) {
    return m.douban_rating != null && m.douban_rating >= 8.8 &&
      parseVotes(m.douban_votes) < 600000;
  });
  return randomPick(cold);
}

// 按类型随机
function randomByType(type) {
  const list = MOVIES.filter(function (m) {
    return (m.genres || []).includes(type);
  });
  return list.length ? randomPick(list) : null;
}

// 按年代随机：1990/2000/2010 或 "old"（更早）
function randomByDecade(d) {
  const list = MOVIES.filter(function (m) {
    const y = parseInt(m.year, 10) || 0;
    if (!y) return false;
    if (d === "old") return y < 1990;
    const start = parseInt(d, 10);
    return y >= start && y < start + 10;
  });
  return list.length ? randomPick(list) : null;
}

function showRandom(m) {
  if (!m) return;
  const box = document.getElementById("random-result");
  box.hidden = false;
  box.innerHTML =
    '<p class="random-result-label">为你随机挑了一部 ↓</p>' +
    '<section class="card">' + movieCardHtml(m, false) + "</section>";
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// —— 导演/演员作品合集 ——
function personMovies(name) {
  return MOVIES.filter(function (m) {
    return (m.directors || []).indexOf(name) >= 0 ||
           (m.actors || []).indexOf(name) >= 0;
  });
}

function showCollection(name) {
  const movies = personMovies(name);
  const box = document.getElementById("collection");

  const items = movies.map(function (m) {
    const poster = m.poster
      ? `<img class="collection-poster" src="${esc(m.poster)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<span class="collection-poster placeholder">🎬</span>`;
    const year = m.year ? `${esc(m.year)} · ` : "";
    return `
      <a class="collection-item" href="${esc(m.douban_url)}" target="_blank" rel="noopener">
        ${poster}
        <span class="collection-info">
          <span class="collection-title">${esc(m.title)}</span>
          <span class="collection-meta">${year}豆瓣 ${fmtScore(m.douban_rating)}</span>
        </span>
      </a>`;
  }).join("");

  const searchUrl = "https://www.douban.com/search?q=" + encodeURIComponent(name);

  box.innerHTML = `
    <div class="collection-head">
      <h3 class="collection-name">「${esc(name)}」的作品
        <span class="collection-count">（片库内 ${movies.length} 部）</span></h3>
      <button class="collection-close" type="button" aria-label="关闭">×</button>
    </div>
    <div class="collection-list">${items}</div>
    <a class="collection-douban" href="${searchUrl}" target="_blank" rel="noopener">在豆瓣查看「${esc(name)}」全部作品 ↗</a>
  `;

  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function bindRandomButtons() {
  document.querySelector(".random-actions").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-kind]");
    if (!btn) return;
    showRandom(btn.dataset.kind === "cold" ? randomCold() : randomAny());
  });

  document.querySelectorAll(".random-tags").forEach(function (box) {
    box.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-type], [data-decade]");
      if (!btn) return;
      let m = null;
      if (btn.dataset.type) m = randomByType(btn.dataset.type);
      else if (btn.dataset.decade) m = randomByDecade(btn.dataset.decade);
      showRandom(m);
    });
  });
}

// 点击导演/演员名 → 展示合集；点关闭 → 收起
document.addEventListener("click", function (e) {
  const link = e.target.closest(".person-link");
  if (link) {
    showCollection(link.dataset.person);
    return;
  }
  if (e.target.closest(".collection-close")) {
    document.getElementById("collection").hidden = true;
  }
});

// —— 复制推荐文案 ——
function copyRecommend(m) {
  const text = "今日推荐｜《" + m.title + "》(" + (m.year || "") + ")\n" +
    "豆瓣 " + fmtScore(m.douban_rating) +
    (m.tmdb_rating != null ? " · TMDB " + fmtScore(m.tmdb_rating) : "") + "\n" +
    (m.reason || "") + "\n—— 每日一部好电影";

  function done() {
    const btn = document.getElementById("copy-btn");
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = "已复制 ✓";
    setTimeout(function () { btn.textContent = old; }, 1500);
  }
  function fail() {
    alert("复制失败，请手动复制：\n\n" + text);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fail);
  } else {
    fail();
  }
}

// —— 生成分享图 ——
function loadImage(url) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(function () { reject(new Error("海报加载超时")); }, 5000);
    img.onload = function () { clearTimeout(timer); resolve(img); };
    img.onerror = function () { clearTimeout(timer); reject(new Error("海报加载失败")); };
    img.src = url;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 中文逐字换行，返回行数组
function wrapText(ctx, text, maxWidth) {
  const chars = String(text || "").split("");
  const lines = [];
  let line = "";
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 30 条落款语录：生成分享图时随机选一条，避免每次都是同一句
const QUOTES = [
  "每天一部，记得看电影",
  "电影是生活的延长线",
  "好电影，值得反复看",
  "生活太短，电影很长",
  "今晚把时间交给一部好电影",
  "一部电影，一个世界",
  "愿你被好电影温柔以待",
  "光影之间，藏着人生",
  "看别人的故事，过自己的人生",
  "好电影从不辜负等待",
  "一部好片，胜过千言万语",
  "让电影陪你度过今晚",
  "在别人的故事里找到自己",
  "每一帧都是时光",
  "电影落幕，感动未散",
  "今天也好好看一部电影吧",
  "屏幕亮起，世界安静",
  "用一场电影治愈今天",
  "好电影是写给生活的情书",
  "光影流转，初心不改",
  "一部片的时间，换一个心情",
  "别急着快进，慢慢看",
  "电影是最好的陪伴",
  "今晚的仪式感，从电影开始",
  "故事会结束，余味很长",
  "把今天交给一部好电影",
  "好电影值得被记住",
  "愿光影照亮你的夜晚",
  "每天一部，慢慢变老",
  "有电影的日子，不算虚度",
];

function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

async function generateShareCard(m) {
  const mood = moodFor(m.genres);
  const colors = MOOD_COLORS[mood] || MOOD_COLORS.drama;
  const W = 800, H = 1200;
  const FONT = "-apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, colors.glow);
  bg.addColorStop(1, "#0e0f16");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部站点名 + 日期
  ctx.textAlign = "center";
  ctx.fillStyle = colors.accent;
  ctx.font = "28px " + FONT;
  ctx.fillText("每日一部好电影", W / 2, 72);
  ctx.fillStyle = "#9a9ab3";
  ctx.font = "22px " + FONT;
  ctx.fillText(currentDate, W / 2, 108);

  // 海报：能加载就画，失败用大字片名代替
  const PW = 320, PH = 480;
  const POSTER_TOP = 140;
  const px = (W - PW) / 2;
  let hasPoster = false;
  if (m.poster) {
    try {
      const img = await loadImage(m.poster);
      ctx.save();
      roundRect(ctx, px, POSTER_TOP, PW, PH, 16);
      ctx.fillStyle = "#161824";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(img, px, POSTER_TOP, PW, PH);
      ctx.restore();
      hasPoster = true;
    } catch (e) {
      hasPoster = false;
    }
  }
  if (!hasPoster) {
    // 占位：圆角框 + 大字片名（按字数自适应字号）
    ctx.save();
    roundRect(ctx, px, POSTER_TOP, PW, PH, 16);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    const len = m.title.length;
    const fs = len >= 7 ? 44 : len >= 5 ? 56 : 72;
    ctx.font = "bold " + fs + "px " + FONT;
    ctx.fillText(m.title, W / 2, POSTER_TOP + PH / 2 + 20);
    ctx.restore();
  }

  // 海报底部留足间距，再排片名（避免压到海报）
  const contentTop = POSTER_TOP + PH + 92;

  // 片名（过长自动缩小）
  ctx.fillStyle = "#ececf4";
  ctx.textAlign = "center";
  let titleSize = 52;
  ctx.font = "bold " + titleSize + "px " + FONT;
  if (ctx.measureText(m.title).width > W - 80) {
    titleSize = 42;
    ctx.font = "bold " + titleSize + "px " + FONT;
  }
  let y = contentTop + 20;
  ctx.fillText(m.title, W / 2, y);

  // 英文名
  y += 48;
  if (m.title_en) {
    ctx.fillStyle = "#9a9ab3";
    ctx.font = "22px " + FONT;
    ctx.fillText(m.title_en, W / 2, y);
    y += 42;
  }

  // 年份 · 类型
  const metaBits = [];
  if (m.year) metaBits.push(m.year);
  if (m.genres && m.genres.length) metaBits.push(m.genres.slice(0, 2).join(" / "));
  if (metaBits.length) {
    ctx.fillStyle = "#9a9ab3";
    ctx.font = "22px " + FONT;
    ctx.fillText(metaBits.join(" · "), W / 2, y);
    y += 42;
  }

  // 导演（有就显示）
  if (m.directors && m.directors.length) {
    ctx.fillStyle = "#9a9ab3";
    ctx.font = "22px " + FONT;
    ctx.fillText("导演：" + m.directors.join("、"), W / 2, y);
    y += 44;
  }

  // 分隔线
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 30, y - 14);
  ctx.lineTo(W / 2 + 30, y - 14);
  ctx.stroke();
  y += 26;

  // 评分：豆瓣 + TMDB 并排居中
  ctx.font = "bold 38px " + FONT;
  const s1 = "豆瓣 " + fmtScore(m.douban_rating);
  const sep = "     ·     ";
  const s2 = m.tmdb_rating != null ? "TMDB " + fmtScore(m.tmdb_rating) : "";
  const totalW = ctx.measureText(s1).width +
    (s2 ? ctx.measureText(sep).width + ctx.measureText(s2).width : 0);
  let sx = (W - totalW) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#00b51a";
  ctx.fillText(s1, sx, y);
  sx += ctx.measureText(s1).width;
  if (s2) {
    ctx.fillStyle = "#9a9ab3";
    ctx.fillText(sep, sx, y);
    sx += ctx.measureText(sep).width;
    ctx.fillStyle = "#01b4e4";
    ctx.fillText(s2, sx, y);
  }
  y += 70;

  // 推荐语（大字、舒展，逐字换行，最多 3 行）
  if (m.reason) {
    ctx.fillStyle = "#d8d8e6";
    ctx.font = "30px " + FONT;
    const lines = wrapText(ctx, m.reason, W - 140).slice(0, 3);
    ctx.textAlign = "left";
    const lh = 56;
    const startY = y;
    for (let i = 0; i < lines.length; i++) {
      const lw = ctx.measureText(lines[i]).width;
      const lx = (W - lw) / 2;
      ctx.fillText(lines[i], lx, startY + i * lh);
    }
  }

  // 底部落款：随机语录
  ctx.fillStyle = colors.accent;
  ctx.font = "24px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText("—— " + randomQuote(), W / 2, H - 48);

  // 导出下载
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "daily-movie-" + currentDate + ".png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

bindRandomButtons();
render();
