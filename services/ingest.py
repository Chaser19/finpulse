# services/ingest.py
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from services.providers import (
    fetch_marketaux,
    fetch_finnhub_general,
    fetch_alpha_vantage,
)
from services.news_repo import NewsRepo
from services.tagger import auto_tags


DATE_FMT = "%Y-%m-%d"


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


def ingest_all(
    data_path: str | Path,
    limit_per_source: int = 30,
    include_alpha_vantage: bool = True,
) -> int:
    """
    Fetch from providers, normalize, auto-tag, de-duplicate, and write to data/news.json.
    Returns the total number of items after merge.

    Hardening:
      - Each provider wrapped in try/except (one failure won't break ingest).
      - Never writes invalid/empty JSON that would crash the site.
      - Fixes prior scoping bugs where tag post-processing ran outside loops.
    """
    batches: List[List[Dict]] = []

    # --- Providers (each guarded) -------------------------------------------
    try:
        # Marketaux free tier: small limits; keep group_similar to reduce dupes.
        items = fetch_marketaux(limit=min(limit_per_source, 3), language="en", group_similar=True)
        batches.append(items or [])
    except Exception as e:
        print("[ingest] Marketaux error:", e)
        batches.append([])

    try:
        items = fetch_finnhub_general()[:limit_per_source]
        batches.append(items or [])
    except Exception as e:
        print("[ingest] Finnhub error:", e)
        batches.append([])

    if include_alpha_vantage:
        try:
            items = fetch_alpha_vantage()[:limit_per_source]
            batches.append(items or [])
        except Exception as e:
            print("[ingest] Alpha Vantage news error:", e)
            batches.append([])

    # Debug counts
    try:
        counts = {
            "Marketaux": len(batches[0]) if len(batches) > 0 else 0,
            "Finnhub": len(batches[1]) if len(batches) > 1 else 0,
            "AlphaV": len(batches[2]) if len(batches) > 2 else 0,
        }
        print("[ingest] provider_counts:", counts)
    except Exception:
        pass

    # --- Merge by ID (provider prefix + URL hash), drop empties --------------
    merged: Dict[str, Dict] = {}
    for batch in batches:
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

    final_rows = list(existing_map.values())
    final_rows.sort(key=lambda x: x.get("date", ""), reverse=True)

    # --- Sanitize & write -----------------------------------------------------
    final_rows = [_json_safe(r) for r in final_rows]

    path = Path(data_path)
    path.write_text(json.dumps(final_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[ingest] wrote {len(final_rows)} items to {path}")
    return len(final_rows)
