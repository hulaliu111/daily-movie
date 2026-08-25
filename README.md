# 每日一部好电影

每天推荐一部电影，按日期确定性地轮换。片库来自豆瓣 Top 250（250 部），TMDB 补全演员与第二评分；另有一个「一周口碑榜」区块，展示豆瓣近期热门的 10 部电影。

- 线上地址：https://hulaliu111.github.io/daily-movie/
- 纯静态站（HTML/CSS/JS），无后端，托管在 GitHub Pages

## 目录结构

| 路径 | 说明 |
|------|------|
| `index.html` / `style.css` / `app.js` | 页面、样式、逻辑 |
| `data.js` | 片库 + 一周口碑榜数据（由脚本生成，勿手改） |
| `posters/` | 海报（已本地化，勿删） |
| `data/` | 采集的原始 JSON（豆瓣 Top250、TMDB 匹配、豆瓣口碑榜） |
| `scripts/` | Python 采集与合成脚本（含 fetch_chart.py 抓口碑榜） |
| `.github/workflows/update-data.yml` | 每周一定时更新 |

## 数据更新

**自动**：每周一北京时间 11:00，GitHub Actions 自动「抓豆瓣 Top250 → 抓 TMDB → 抓口碑榜 → 生成 data.js → 下载海报 → 提交」。也可在仓库 Actions 页手动触发 Run workflow。

**手动（本地）**：需 Python 3 + `pip install -r requirements.txt` + TMDB key（放 `config.local.json`，格式 `{"tmdb_api_key": "..."}`，已 gitignore）：

```
python3 scripts/fetch_douban.py       # 抓豆瓣 Top 250
python3 scripts/fetch_tmdb.py         # TMDB 匹配补演员/评分
python3 scripts/fetch_chart.py        # 抓一周口碑榜（评分 + 海报）
python3 scripts/build_data.py         # 合成 data.js
python3 scripts/download_posters.py   # 下载 Top250 海报到 posters/
```

## 兜底策略

- 豆瓣必须抓满 250 部才写文件，否则保留上一次成功的数据（不覆盖）。
- TMDB 单部失败不影响整体；海报缺失时前端有文字占位兜底。
- 海报下载幂等，缺的图重跑脚本即可补齐。

## 常见问题

- **封面加载不出**：海报已本地化到 `posters/`，正常不会发生；若发生，重跑 `python3 scripts/download_posters.py`。
- **git push 报 `SSL_ERROR_SYSCALL`**：代理软件对 HTTP/2 干扰所致，仓库已配置 `git config http.version HTTP/1.1`；新 clone 的仓库需手动再配一次。

## 本地预览

```
python3 -m http.server 8000
```

然后浏览器打开 http://localhost:8000

## 免责声明

本站仅供学习交流、非商业用途。影片数据、海报与文字介绍版权归原作者及来源平台（豆瓣、TMDB）所有。
