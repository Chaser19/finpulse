# services/providers.py
from __future__ import annotations
import os, hashlib, re
from datetime import datetime, timezone
import requests
from typing import List, Dict

DATE_FMT = "%Y-%m-%d"

def _mk_id(provider: str, url: str) -> str:
    return f"{provider}:{hashlib.sha1(url.encode('utf-8')).hexdigest()[:16]}"

def _yyyy_mm_dd(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime(DATE_FMT)
    except Exception:
        return datetime.utcnow().strftime(DATE_FMT)

def _map_category(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    if any(k in text for k in ["opec", "brent", "wti", "crude", "refinery", "gasoline", "diesel"]):
        return "Oil"
    if any(k in text for k in ["inflation", "cpi", "ppi", "deflator", "core"]):
        return "Inflation"
    if any(k in text for k in ["copper", "aluminum", "nickel", "lme", "soy", "wheat", "corn", "commodit"]):
        return "Commodities"
    return "Markets"

# --- Marketaux: Global finance/market news -----------------------------------
def fetch_marketaux(
    *,
    search: str | None = None,
    industries: list[str] | None = None,   # e.g. ["Energy","Materials","Technology"]
    countries: list[str] | None = None,    # e.g. ["us","gb"]
    language: str = "en",
    limit: int = 3,                        # free tier returns up to 3 articles/request
    must_have_entities: bool = False,
    filter_entities: bool = False,
    group_similar: bool = True,
) -> list[dict]:
    """
    Fetch recent finance news from Marketaux /v1/news/all and normalize to FinPulse schema.
    Docs: https://api.marketaux.com/v1/news/all (see site docs).
    """
    import os, requests

    key = os.getenv("MARKETAUX_KEY")
    if not key:
        return []

    base = "https://api.marketaux.com/v1/news/all"

    params = {
        "api_token": key,
        "language": language,
        "limit": limit,
        "group_similar": "true" if group_similar else "false",
        "must_have_entities": "true" if must_have_entities else "false",
        "filter_entities": "true" if filter_entities else "false",
    }
    if search:
        params["search"] = search
    if industries:
        params["industries"] = ",".join(industries)
    if countries:
        params["countries"] = ",".join(countries)

    r = requests.get(base, params=params, timeout=20)
    r.raise_for_status()
    data = r.json() or {}
    articles = data.get("data") or []

    items: list[dict] = []
    for a in articles:
        # Marketaux fields per docs: title, description, url, published_at, source (domain), entities[]...
        # https://www.marketaux.com/documentation
        title = a.get("title") or ""
        summary = a.get("description") or a.get("snippet") or ""
        url = a.get("url") or ""
        published = a.get("published_at") or ""
        date = _yyyy_mm_dd(published)
        source_domain = a.get("source") or "Marketaux"

        # Tags: use entity symbols + industries when present
        ent_tags: list[str] = []
        for ent in (a.get("entities") or []):
            sym = ent.get("symbol")
            ind = ent.get("industry")
            if sym:
                ent_tags.append(sym)
            if ind:
                ent_tags.append(ind)

        items.append({
            "id": _mk_id("marketaux", url or title),
            "title": title,
            "summary": summary,
            "date": date,
            "source": f"Marketaux: {source_domain}",
            "url": url,
            "category": _map_category(title, summary),
            "tags": ent_tags,
        })

    return items

# --- Finnhub: general news ---------------------------------------------------
def fetch_finnhub_general() -> List[Dict]:
    key = os.getenv("FINNHUB_KEY")
    if not key:
        return []
    url = "https://finnhub.io/api/v1/news"
    params = {"category": "general", "token": key}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    items = []
    for a in r.json():
        u = a.get("url") or ""
        title = a.get("headline") or ""
        summary = a.get("summary") or ""
        src = a.get("source") or "Finnhub"
        dt = a.get("datetime")  # unix seconds
        date = datetime.utcfromtimestamp(dt).strftime(DATE_FMT) if dt else _yyyy_mm_dd("")
        items.append({
            "id": _mk_id("finnhub", u),
            "title": title,
            "summary": summary,
            "date": date,
            "source": f"Finnhub: {src}",
            "url": u,
            "category": _map_category(title, summary),
            "tags": []
        })
    return items

# --- Alpha Vantage: News & Sentiment ----------------------------------------
def fetch_alpha_vantage() -> List[Dict]:
    key = os.getenv("ALPHAVANTAGE_KEY")
    if not key:
        return []
    url = "https://www.alphavantage.co/query"
    params = {"function": "NEWS_SENTIMENT", "topics": "financial_markets", "apikey": key}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()

    data = r.json()

    # Alpha Vantage can return different shapes or throttle messages
    feed = data.get("feed") or data.get("items") or []
    if not isinstance(feed, list):
        feed = []

    items: List[Dict] = []
    for a in feed:
        if not isinstance(a, dict):
            continue

        u = a.get("url") or ""
        title = a.get("title") or ""
        summary = a.get("summary") or ""

        # source can be dict or string
        raw_source = a.get("source")
        if isinstance(raw_source, dict):
            src = raw_source.get("name") or "Alpha Vantage"
        elif isinstance(raw_source, str):
            src = raw_source or "Alpha Vantage"
        else:
            src = "Alpha Vantage"

        # time_published like 20250811T130000Z / 20250811T130000
        tp = (a.get("time_published") or "").rstrip("Z")
        if len(tp) >= 8 and tp[:8].isdigit():
            date = f"{tp[:4]}-{tp[4:6]}-{tp[6:8]}"
        else:
            date = _yyyy_mm_dd("")

        # topics can be list[dict] or list[str]
        raw_topics = a.get("topics") or []
        topics: List[str] = []
        for t in raw_topics:
            if isinstance(t, dict) and t.get("topic"):
                topics.append(str(t["topic"]))
            elif isinstance(t, str):
                topics.append(t)

        items.append({
            "id": _mk_id("alphav", u or title or summary),
            "title": title,
            "summary": summary,
            "date": date,
            "source": f"Alpha Vantage: {src}",
            "url": u,
            "category": _map_category(title, summary),
            "tags": topics,
        })

    return items