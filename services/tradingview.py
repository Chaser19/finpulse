"""Lightweight TradingView scanner client shared across social features."""

from __future__ import annotations

import time
from typing import Any, Dict, Iterable, List, Sequence

import requests

SCAN_URL = "https://scanner.tradingview.com/america/scan"
SCAN_COLUMNS = ["close", "pricescale", "volume", "change", "change_abs"]
_CACHE: Dict[tuple[str, ...], tuple[float, Dict[str, Dict[str, Any]]]] = {}
_CACHE_TTL_DEFAULT = 20  # seconds


def _normalise_symbols(symbols: Iterable[str]) -> List[str]:
    uniq: List[str] = []
    seen: set[str] = set()
    for raw in symbols:
        token = (raw or "").strip()
        if not token:
            continue
        token = token.lstrip("$").upper()
        if token and token not in seen:
            seen.add(token)
            uniq.append(token)
    return uniq


def fetch_snapshots(symbols: Sequence[str], *, ttl: int = _CACHE_TTL_DEFAULT) -> Dict[str, Dict[str, Any]]:
    """
    Fetch the latest quote/volume snapshot for a batch of US tickers using
    TradingView's public scanner endpoint. Results are cached briefly to
    avoid hammering the unauthenticated API.
    """
    normalized = _normalise_symbols(symbols)
    if not normalized:
        return {}

    cache_key = tuple(normalized)
    now = time.time()
    cached = _CACHE.get(cache_key)
    if cached and now - cached[0] < max(1, ttl):
        return cached[1]

    tv_symbols = [f"NASDAQ:{sym}" for sym in normalized]
    payload = {
        "symbols": {"tickers": tv_symbols, "query": {"types": []}},
        "columns": SCAN_COLUMNS,
    }

    try:
        resp = requests.post(SCAN_URL, json=payload, timeout=6)
        resp.raise_for_status()
        data = resp.json().get("data", [])
    except Exception as exc:
        print(f"[tradingview] snapshot failed: {exc}")
        return {}

    out: Dict[str, Dict[str, Any]] = {}
    for item in data:
        symbol_token = item.get("s") or ""
        if not isinstance(symbol_token, str):
            continue
        inline_symbol = symbol_token.split(":", 1)[1] if ":" in symbol_token else symbol_token
        cols = item.get("d", []) or []
        if len(cols) < len(SCAN_COLUMNS):
            continue
        close, scale, volume, change_pct, change_abs = cols[:5]
        price_scale = scale or 1
        try:
            close_price = float(close) / (price_scale if price_scale not in (0, None) else 1)
        except Exception:
            try:
                close_price = float(close)
            except Exception:
                continue

        out[inline_symbol.upper()] = {
            "close": round(close_price, 2),
            "change_pct": round(float(change_pct or 0), 2),
            "change_abs": round(float(change_abs or 0), 2),
            "volume": float(volume or 0),
            "timestamp": int(now),
            "tradingview_symbol": symbol_token,
            "source": "tradingview",
        }

    _CACHE[cache_key] = (now, out)
    return out

