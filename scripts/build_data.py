#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 data/douban_top250.json 转成前端 data.js（const MOVIES = [...]）。

豆瓣数据里没有烂番茄分，rt_tomatometer / rt_audience 先置 None，阶段 3 由 TMDB 或烂番茄补全。

用法：python3 scripts/build_data.py
"""
import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
IN_FILE = os.path.join(DATA_DIR, "douban_top250.json")
OUT_FILE = os.path.join(SCRIPT_DIR, "..", "data.js")


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def to_float(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def parse_info(info):
    """从豆瓣列表页的 info 字符串提取 year / directors / actors / genres。"""
    year = ""
    m = re.search(r"(\d{4})", info)
    if m:
        year = m.group(1)

    directors, actors, genres = [], [], []

    # 导演：`导演: ` 到 `主演:` 之间，去掉英文名只留中文
    dm = re.search(r"导演:\s*(.*?)\s*主演:", info)
    if dm:
        d = clean(re.sub(r"[A-Za-z][A-Za-z\s.\-]*", " ", dm.group(1)))
        if d:
            directors = [d]

    # 主演：`主演: ` 到年份之间，按 / 分割，去掉英文名
    am = re.search(r"主演:\s*(.*?)\s*\d{4}", info)
    if am:
        for p in am.group(1).split("/"):
            p = clean(re.sub(r"[A-Za-z][A-Za-z\s.\-]*", " ", p))
            if p and p != "...":
                actors.append(p)

    # 类型：最后一个 / 后面按空格分词
    parts = [clean(x) for x in info.split("/")]
    if parts:
        genres = [g for g in parts[-1].split() if g]

    return year, directors, actors, genres


def subject_id(url):
    m = re.search(r"/subject/(\d+)", url or "")
    return m.group(1) if m else ""


def build():
    with open(IN_FILE, encoding="utf-8") as f:
        data = json.load(f)

    movies = []
    for d in data:
        year, directors, actors, genres = parse_info(d.get("info", ""))
        reason = d.get("quote", "").strip()
        if not reason:
            reason = f"豆瓣 Top 250 第 {d.get('rank', '')} 名，评分 {d.get('douban_rating', '')}。"

        movies.append({
            "id": "douban-" + subject_id(d.get("url")),
            "title": d.get("title", ""),
            "title_en": d.get("title_en", ""),
            "year": year,
            "directors": directors,
            "actors": actors[:5],
            "genres": genres,
            "douban_rating": to_float(d.get("douban_rating")),
            "douban_votes": d.get("douban_votes", ""),
            "rt_tomatometer": None,   # 阶段 3 补
            "rt_audience": None,       # 阶段 3 补
            "reason": reason,
            "poster": d.get("poster", ""),
            "douban_url": d.get("url", ""),
        })

    js = "// 本文件由 scripts/build_data.py 自动生成，请勿手动编辑\n"
    js += "const MOVIES = " + json.dumps(movies, ensure_ascii=False, indent=2) + ";\n"
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"[完成] 已生成 {OUT_FILE}，共 {len(movies)} 部")


if __name__ == "__main__":
    build()
