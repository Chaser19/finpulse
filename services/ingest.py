# services/ingest.py
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import re

from services.providers import (
    fetch_marketaux,
    fetch_finnhub_general,
    fetch_alpha_vantage,
    fetch_newsapi,
)
from services.news_repo import NewsRepo
from services.tagger import auto_tags


DATE_FMT = "%Y-%m-%d"

SOURCE_ALLOWLIST = {
    "reuters",
    "bloomberg",
    "wall street journal",
    "wsj",
    "financial times",
    "ft.com",
    "cnbc",
    "marketwatch",
    "yahoo finance",
    "yahoo news",
    "yahoo",
    "barron",
    "investing.com",
    "investopedia",
    "financial post",
    "politico",
    "associated press",
    "ap news",
    "apnews",
    "the hill",
    "washington post",
    "new york times",
    "nytimes",
    "fortune",
    "forbes",
    "business insider",
    "benzinga",
    "motley fool",
    "cnbc international",
    "nikkei",
    "ft advisor",
    "economist",
    "cbs news",
    "abc news",
    "bbc",
    "guardian",
    "axios",
}

FINANCE_KEYWORDS = {
    "market",
    "markets",
    "stock",
    "stocks",
    "share",
    "shares",
    "equity",
    "equities",
    "earnings",
    "profit",
    "loss",
    "outlook",
    "forecast",
    "revenue",
    "ipo",
    "merger",
    "acquisition",
    "deal",
    "treasury",
    "bond",
    "bonds",
    "yield",
    "yields",
    "spread",
    "credit",
    "bank",
    "banks",
    "loan",
    "inflation",
    "cpi",
    "ppi",
    "gdp",
    "jobs",
    "employment",
    "labour",
    "labor",
    "unemployment",
    "federal reserve",
    "fed",
    "interest rate",
    "interest rates",
    "rate hike",
    "rate cut",
    "monetary policy",
    "currency",
    "currencies",
    "forex",
    "fx",
    "dollar",
    "yen",
    "yuan",
    "euro",
    "oil",
    "energy",
    "gas",
    "commodity",
    "commodities",
    "metals",
    "gold",
    "silver",
    "energy",
    "petroleum",
}

POLICY_KEYWORDS = {
    "policy",
    "fiscal",
    "budget",
    "deficit",
    "tariff",
    "tariffs",
    "sanction",
    "sanctions",
    "trade",
    "trade policy",
    "trade deal",
    "geopolitic",
    "geopolitical",
    "diplomacy",
    "diplomatic",
    "parliament",
    "congress",
    "senate",
    "house of representatives",
    "white house",
    "regulation",
    "regulatory",
    "legislation",
    "bill",
    "election",
    "elections",
    "campaign",
    "coalition",
    "summit",
    "nato",
    "war",
    "conflict",
    "ukraine",
    "russia",
    "china",
    "taiwan",
    "middle east",
    "israel",
    "sanctioned",
}

FINANCE_TAG_HINTS = {
    "spy",
    "qqq",
    "iwm",
    "sp500",
    "s&p 500",
    "nasdaq",
    "dow",
    "treasury",
    "bonds",
    "yields",
    "inflation",
    "fed",
    "ecb",
    "boe",
    "boj",
    "rates",
    "energy",
    "oil",
    "gas",
    "commodities",
    "macro",
    "finance",
    "markets",
}

POLICY_TAG_HINTS = {
    "policy",
    "sanctions",
    "tariffs",
    "geopolitics",
    "geopolitical",
    "white house",
    "congress",
    "senate",
    "regulation",
    "legislation",
    "election",
    "war",
    "nato",
}

CATEGORY_SIGNALS = {
    "markets": "finance",
    "inflation": "finance",
    "oil": "finance",
    "commodities": "finance",
    "rates": "finance",
    "macro": "finance",
    "policy": "policy",
    "geopolitics": "policy",
}


def _is_ticker_token(t: str) -> bool:
    """
    Very lightweight ticker heuristic (A–Z only, 1–5 chars, already uppercase).
    We only prefix $ when it *looks* like a ticker and doesn't already start with $.
    """
    if not isinstance(t, str) or not t:
        return False
    raw = t.lstrip("$")
    return raw.isalpha() and 1 <= len(raw) <= 5 and raw.upper() == raw


def _json_safe(row: dict) -> dict:
    """
    Sanitize one record for JSON output and UI consumption.
    - Drop internal fields (e.g., _date)
    - Coerce date to YYYY-MM-DD
    - Ensure tags is list[str]
    - Coerce common string fields
    """
    r = dict(row)  # shallow copy
    r.pop("_date", None)

    # Date → string
    d = r.get("date")
    if isinstance(d, datetime):
        r["date"] = d.strftime(DATE_FMT)
    elif isinstance(d, str) and len(d) >= 10:
        r["date"] = d[:10]
    else:
        r["date"] = datetime.utcnow().strftime(DATE_FMT)

    # Tags → list[str]
    tags = r.get("tags", [])
    if tags is None:
        r["tags"] = []
    elif not isinstance(tags, list):
        r["tags"] = [str(tags)]
    else:
        r["tags"] = [str(t) for t in tags]

    # Common fields → strings
    for k in ("id", "title", "summary", "source", "url", "category"):
        if k in r and r[k] is not None and not isinstance(r[k], str):
            r[k] = str(r[k])

    return r


def _normalize_source_name(source: str) -> str:
    lowered = source.lower()
    lowered = (
        lowered.replace("newsapi:", "")
        .replace("alphavantage:", "")
        .replace("alpha vantage:", "")
        .replace("finnhub:", "")
        .replace("marketaux:", "")
    )
    return re.sub(r"[^a-z0-9]+", " ", lowered).strip()


def _allowed_source(source: str | None) -> bool:
    if not source:
        return False
    norm = _normalize_source_name(source)
    return any(token in norm for token in SOURCE_ALLOWLIST)


def _normalize_tags(tags: List[str] | None) -> List[str]:
    out: List[str] = []
    if not tags:
        return out
    for tag in tags:
        if not isinstance(tag, str):
            continue
        cleaned = tag.lower().lstrip("#$")
        if cleaned:
            out.append(cleaned)
    return out


def _match_keywords(text: str, keywords: set[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _classify_article(article: Dict[str, Any]) -> str:
    title = article.get("title") or ""
    summary = article.get("summary") or ""
    text = f"{title} {summary}".lower()
    tags = _normalize_tags(article.get("tags"))
    category = (article.get("category") or "").lower()

    finance_hit = _match_keywords(text, FINANCE_KEYWORDS) or any(tag in FINANCE_TAG_HINTS for tag in tags)
    policy_hit = _match_keywords(text, POLICY_KEYWORDS) or any(tag in POLICY_TAG_HINTS for tag in tags)

    signal = CATEGORY_SIGNALS.get(category)
    if signal == "finance":
        finance_hit = True
    elif signal == "policy":
        policy_hit = True

    if finance_hit and policy_hit:
        return "mixed"
    if finance_hit:
        return "finance"
    if policy_hit:
        return "policy"
    return "other"


def _is_relevant_article(article: Dict[str, Any]) -> bool:
    if (article.get("category") or "").lower() == "system":
        return False
    if not _allowed_source(article.get("source")):
        return False
    classification = _classify_article(article)
    return classification in {"finance", "policy", "mixed"}


def ingest_all(
    data_path: str | Path,
    limit_per_source: int = 30,
    include_alpha_vantage: bool = True,
    include_newsapi: bool = True,
) -> int:
    """
    Fetch from providers, normalize, auto-tag, de-duplicate, and write to data/news.json.
    Returns the total number of items after merge.

    Hardening:
      - Each provider wrapped in try/except (one failure won't break ingest).
      - Never writes invalid/empty JSON that would crash the site.
      - Fixes prior scoping bugs where tag post-processing ran outside loops.
    """
    provider_batches: List[tuple[str, List[Dict]]] = []

    # --- Providers (each guarded) -------------------------------------------
    try:
        # Marketaux free tier: small limits; keep group_similar to reduce dupes.
        items = fetch_marketaux(limit=min(limit_per_source, 3), language="en", group_similar=True)
        provider_batches.append(("Marketaux", items or []))
    except Exception as e:
        print("[ingest] Marketaux error:", e)
        provider_batches.append(("Marketaux", []))

    try:
        items = fetch_finnhub_general()[:limit_per_source]
        provider_batches.append(("Finnhub", items or []))
    except Exception as e:
        print("[ingest] Finnhub error:", e)
        provider_batches.append(("Finnhub", []))

    if include_alpha_vantage:
        try:
            items = fetch_alpha_vantage()[:limit_per_source]
            provider_batches.append(("AlphaV", items or []))
        except Exception as e:
            print("[ingest] Alpha Vantage news error:", e)
            provider_batches.append(("AlphaV", []))

    if include_newsapi:
        try:
            items = fetch_newsapi(page_size=min(limit_per_source, 60))
            provider_batches.append(("NewsAPI", items or []))
        except Exception as e:
            print("[ingest] NewsAPI error:", e)
            provider_batches.append(("NewsAPI", []))

    # Debug counts
    try:
        counts = {name: len(batch) for name, batch in provider_batches}
        print("[ingest] provider_counts:", counts)
    except Exception:
        pass

    # --- Merge by ID (provider prefix + URL hash), drop empties --------------
    merged: Dict[str, Dict] = {}
    for _, batch in provider_batches:
        for item in batch:
            if not item:
                continue
            if not item.get("url") and not item.get("title"):
                continue
            iid = item.get("id")
            if not iid:
                # last-ditch id
                iid = f"auto:{hash(item.get('url') or item.get('title'))}"
                item["id"] = iid
            merged[iid] = item

    new_rows = list(merged.values())

    # If *nothing* was fetched, DO NOT blow away the current file.
    # We'll just re-write the existing file (after re-tagging) and add a marker item.
    repo = NewsRepo(data_path)
    existing = repo.list_all()

    if not new_rows and not existing:
        # Write a minimal placeholder so UI never crashes
        placeholder = [{
            "id": "system:no-news",
            "title": "No news available",
            "summary": "All providers failed or API keys missing. Check your .env and try again.",
            "source": "FinPulse",
            "date": datetime.utcnow().strftime(DATE_FMT),
            "category": "System",
            "tags": ["error"],
            "url": "#",
        }]
        Path(data_path).write_text(json.dumps(placeholder, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[ingest] wrote placeholder (no providers returned data)")
        return len(placeholder)

    # Sort newest → oldest (string dates ok; YYYY-MM-DD)
    new_rows.sort(key=lambda x: x.get("date", ""), reverse=True)

    # --- Auto-generate tags for new rows -------------------------------------
    for r in new_rows:
        base = r.get("tags") or []
        r["tags"] = auto_tags(r.get("title", ""), r.get("summary", ""), base=base, limit=6)
        # Prefix potential ticker-looking tokens with $ (once)
        r["tags"] = [f"${t.lstrip('$')}" if _is_ticker_token(t) else t for t in r["tags"]]

    # --- Merge with existing data by id (keep newest for same id) ------------
    existing_map: Dict[str, Dict] = {e["id"]: e for e in existing if isinstance(e, dict) and "id" in e}
    for r in new_rows:
        existing_map[r["id"]] = r

    # Ensure existing items also have tags (idempotent)
    for e in existing_map.values():
        ex = e.get("tags") or []
        e["tags"] = auto_tags(e.get("title", ""), e.get("summary", ""), base=ex, limit=6)
        e["tags"] = [f"${t.lstrip('$')}" if _is_ticker_token(t) else t for t in e["tags"]]

    final_rows = [row for row in existing_map.values() if _is_relevant_article(row)]
    final_rows.sort(key=lambda x: x.get("date", ""), reverse=True)

    if not final_rows:
        placeholder = [{
            "id": "system:no-relevant-news",
            "title": "No qualifying financial or policy headlines",
            "summary": "Provider responses were filtered out by the finance/policy focus rules. Check source allowlist or keyword filters.",
            "source": "FinPulse",
            "date": datetime.utcnow().strftime(DATE_FMT),
            "category": "System",
            "tags": ["maintenance"],
            "url": "#",
        }]
        Path(data_path).write_text(json.dumps(placeholder, ensure_ascii=False, indent=2), encoding="utf-8")
        print("[ingest] wrote placeholder (no relevant articles after filtering)")
        return len(placeholder)

    # --- Sanitize & write -----------------------------------------------------
    final_rows = [_json_safe(r) for r in final_rows]

    path = Path(data_path)
    path.write_text(json.dumps(final_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[ingest] wrote {len(final_rows)} items to {path}")
    return len(final_rows)
