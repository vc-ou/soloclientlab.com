#!/usr/bin/env python3
"""
Bing Webmaster Tools 只读数据采集脚本（Research Agent 用，FR-20260827-001）

功能：
  - 用 API key 读取 Bing Webmaster 的流量统计（GetRankAndTrafficStats）与查询词统计（GetQueryStats）
  - 输出：clicks / impressions 按日明细 + top queries

运行：
  /Users/vc/.workbuddy/binaries/python/envs/default/bin/python scripts/bing-collect.py

关键配置（读取独立站项目 .env.local）：
  BING_WEBMASTER_API_KEY=... （必填，Bing Webmaster Tools Settings > API Access 生成的 key）
  BING_PROXY_URL=http://127.0.0.1:7897 （可选；不配置则直连——Bing 不走 Google 通道，通常可直连）

已知坑（不要改回去）：
  1. API key 必须作为 URL query 参数 `?apikey=...` 传递；
     放 header（api-key / Authorization: Basic）会返回 InvalidApiKey。
  2. 站点 URL 是 https://soloclientlab.com/（无 www，已验证 IsVerified=true）；
     用 https://www.soloclientlab.com/ 会取不到数据。
  3. GetRankAndTrafficStats 实际返回窗口可能大于请求的 startDate/endDate，
     脚本内按 /Date(毫秒-时区)/ 解析并过滤到目标窗口。
"""
import os
import sys
import json
import argparse
import re
from datetime import date, timedelta, datetime, timezone

import requests

BASE = "https://ssl.bing.com/webmaster/api.svc/json"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env(path):
    env = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


def make_session(proxy_url=None):
    s = requests.Session()
    s.trust_env = False  # 与 GSC 脚本一致：绕过 WorkBuddy 注入的 50027 代理
    if proxy_url:
        s.proxies.update({"http": proxy_url, "https": proxy_url})
    return s


def parse_ms_date(ms_str):
    m = re.match(r"/Date\((\d+)([+-]\d{4})\)/", ms_str)
    if not m:
        return None
    ms = int(m.group(1))
    tz = m.group(2)
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).date()


def get(session, api_key, endpoint, params):
    params = dict(params)
    params["apikey"] = api_key
    r = session.get(f"{BASE}/{endpoint}", params=params, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"{endpoint} {r.status_code}: {r.text[:300]}")
    return r.json().get("d", [])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=None, help="可选：输出 JSON 文件路径")
    args = parser.parse_args()

    env = load_env(os.path.join(PROJECT_ROOT, ".env.local"))
    api_key = env.get("BING_WEBMASTER_API_KEY")
    if not api_key:
        print("ERROR: BING_WEBMASTER_API_KEY 未配置（检查 .env.local）", file=sys.stderr)
        sys.exit(1)
    proxy_url = env.get("BING_PROXY_URL")  # 可选，None=直连

    session = make_session(proxy_url)
    site = "https://soloclientlab.com/"

    # 0. 校验站点（可选）
    sites = get(session, api_key, "GetUserSites", {})
    site_verified = any(s.get("Url") == site and s.get("IsVerified") for s in sites)
    if not site_verified:
        print(f"WARNING: {site} 未在 Bing 账户中验证，后续接口可能返回空", file=sys.stderr)

    today = date.today()
    windows = {
        "last_7d": (today - timedelta(days=7), today),
        "prev_7d": (today - timedelta(days=14), today - timedelta(days=7)),
        "last_28d": (today - timedelta(days=28), today),
        "prev_28d": (today - timedelta(days=56), today - timedelta(days=28)),
    }

    # 一次拉取大窗口，再按日过滤
    traffic = get(session, api_key, "GetRankAndTrafficStats",
                  {"siteUrl": site, "startDate": (today - timedelta(days=60)).isoformat(),
                   "endDate": today.isoformat()})

    result = {"site": site, "collected_at": today.isoformat(), "windows": {}}
    for name, (start, end) in windows.items():
        days = []
        for t in traffic:
            d = parse_ms_date(t.get("Date", ""))
            if d and start <= d <= end:
                days.append({"date": d.isoformat(), "clicks": t.get("Clicks", 0), "impressions": t.get("Impressions", 0)})
        clicks = sum(x["clicks"] for x in days)
        impressions = sum(x["impressions"] for x in days)
        result["windows"][name] = {
            "period": [start.isoformat(), end.isoformat()],
            "clicks": clicks,
            "impressions": impressions,
            "days": days,
        }

    # 查询词（28d 全量拉取，按需过滤）
    q_raw = get(session, api_key, "GetQueryStats",
                {"siteUrl": site, "startDate": (today - timedelta(days=56)).isoformat(),
                 "endDate": today.isoformat()})
    queries = []
    for q in q_raw:
        d = parse_ms_date(q.get("Date", ""))
        if not d:
            continue
        queries.append({
            "query": q.get("Query"),
            "date": d.isoformat(),
            "clicks": q.get("Clicks", 0),
            "impressions": q.get("Impressions", 0),
            "avg_impression_position": q.get("AvgImpressionPosition"),
        })
    result["queries_28d"] = queries

    out = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"written: {args.out}")
    else:
        print(out)


if __name__ == "__main__":
    main()
