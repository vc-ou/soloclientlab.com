#!/usr/bin/env python3
"""
GSC 只读数据采集脚本（Research Agent 用，FR-20260827-001）

功能：
  - 用 service account 读取 Google Search Console 的 7d/28d 与前 7d/28d 对比数据
  - 输出：clicks / impressions / ctr / position + top queries + top pages

运行：
  /Users/vc/.workbuddy/binaries/python/envs/default/bin/python scripts/gsc-collect.py

依赖（已装入隔离 venv）：
  pip install google-auth requests

关键配置（读取独立站项目 .env.local）：
  GSC_SERVICE_ACCOUNT_KEY_PATH=... （必填，service account JSON 路径）
  GSC_PROXY_URL=http://127.0.0.1:7897 （可选，默认 7897=Clash 系系统代理端口）

已知坑（不要改回去）：
  1. WorkBuddy 会向 shell 注入 HTTP_PROXY=127.0.0.1:50027，该代理到不了 Google；
     必须 trust_env=False + 显式 proxies 才能走到用户的 7897 代理。
  2. AuthorizedSession 刷新 token 时用的是内部 session，必须传 auth_request=Request(session=s)，
     否则 token 刷新仍走 50027 导致 502。
  3. 站点属性用 sc-domain:soloclientlab.com（域属性），
     https://www.soloclientlab.com/ 会返回 404（未添加 URL 前缀属性）。
"""
import os
import sys
import json
import argparse
from datetime import date, timedelta

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession, Request

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
SITE = "sc-domain:soloclientlab.com"
BASE = "https://www.googleapis.com/webmasters/v3"

# 项目根：脚本位于 08-工程项目/独立站-SoloClientLab/scripts/ 下
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


def make_session(proxy_url):
    s = requests.Session()
    s.trust_env = False  # 关键：绕过 WorkBuddy 注入的 50027 代理
    if proxy_url:
        s.proxies.update({"http": proxy_url, "https": proxy_url})
    return s


def fetch(creds, proxy_url, start, end, dimensions, row_limit=25):
    s = make_session(proxy_url)
    auth = AuthorizedSession(creds, auth_request=Request(session=s))
    auth.trust_env = False
    auth.proxies.update(s.proxies)
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": dimensions,
        "rowLimit": row_limit,
    }
    r = auth.post(f"{BASE}/sites/{SITE}/searchAnalytics/query", json=body, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"searchAnalytics {r.status_code}: {r.text[:300]}")
    return r.json().get("rows", [])


def aggregate(rows):
    return {
        "clicks": sum(row.get("clicks", 0) for row in rows),
        "impressions": sum(row.get("impressions", 0) for row in rows),
        "ctr": round(sum(row.get("clicks", 0) for row in rows) / sum(row.get("impressions", 0) for row in rows) * 100, 2)
        if sum(row.get("impressions", 0) for row in rows)
        else 0.0,
        "position": round(sum(row.get("position", 0) * row.get("impressions", 0) for row in rows) / sum(row.get("impressions", 0) for row in rows), 1)
        if sum(row.get("impressions", 0) for row in rows)
        else None,
        "top_queries": [
            {"query": row["keys"][0], "clicks": row.get("clicks", 0), "impressions": row.get("impressions", 0)}
            for row in rows[:10]
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=None, help="可选：输出 JSON 文件路径")
    args = parser.parse_args()

    env = load_env(os.path.join(PROJECT_ROOT, ".env.local"))
    key_path = env.get("GSC_SERVICE_ACCOUNT_KEY_PATH")
    if not key_path or not os.path.exists(key_path):
        print("ERROR: GSC_SERVICE_ACCOUNT_KEY_PATH 未配置或文件不存在（检查 .env.local）", file=sys.stderr)
        sys.exit(1)
    proxy_url = env.get("GSC_PROXY_URL", "http://127.0.0.1:7897")

    creds = service_account.Credentials.from_service_account_file(key_path, scopes=SCOPES)

    today = date.today()
    windows = {
        "last_7d": (today - timedelta(days=7), today),
        "prev_7d": (today - timedelta(days=14), today - timedelta(days=7)),
        "last_28d": (today - timedelta(days=28), today),
        "prev_28d": (today - timedelta(days=56), today - timedelta(days=28)),
    }

    result = {"site": SITE, "collected_at": today.isoformat(), "windows": {}}
    for name, (start, end) in windows.items():
        q_rows = fetch(creds, proxy_url, start, end, ["query"])
        p_rows = fetch(creds, proxy_url, start, end, ["page"])
        result["windows"][name] = {
            "period": [start.isoformat(), end.isoformat()],
            "queries": aggregate(q_rows),
            "pages": aggregate(p_rows),
        }

    # 顶层汇总：最近 7d 与 28d 的核心指标
    r7, p7 = result["windows"]["last_7d"], result["windows"]["prev_7d"]
    r28, p28 = result["windows"]["last_28d"], result["windows"]["prev_28d"]
    result["summary"] = {
        "7d": {"clicks": r7["queries"]["clicks"], "impressions": r7["queries"]["impressions"],
               "ctr": r7["queries"]["ctr"], "position": r7["queries"]["position"],
               "delta_clicks": r7["queries"]["clicks"] - p7["queries"]["clicks"],
               "delta_impressions": r7["queries"]["impressions"] - p7["queries"]["impressions"]},
        "28d": {"clicks": r28["queries"]["clicks"], "impressions": r28["queries"]["impressions"],
                "ctr": r28["queries"]["ctr"], "position": r28["queries"]["position"],
                "delta_clicks": r28["queries"]["clicks"] - p28["queries"]["clicks"],
                "delta_impressions": r28["queries"]["impressions"] - p28["queries"]["impressions"]},
    }

    out = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"written: {args.out}")
    else:
        print(out)


if __name__ == "__main__":
    main()
