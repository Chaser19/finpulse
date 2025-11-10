"""Alpha Vantage helpers for price history fetches."""

from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Any, Dict, Iterable, List, Tuple

import requests

AV_BASE_URL = "https://www.alphavantage.co/query"
_CACHE: Dict[Tuple[str, str], Tuple[float, List[Dict[str, float]], Dict[str, Any]]] = {}
_CACHE_TTL = int(os.getenv("ALPHAVANTAGE_CACHE_TTL", "900"))  # seconds


def _api_key() -> str:
    return os.getenv("ALPHAVANTAGE_KEY", "").strip()


def _request(params: Dict[str, str]) -> Tuple[Dict[str, Any], str | None, str | None]:
    note = None
    error = None
    try:
        resp = requests.get(AV_BASE_URL, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict):
            if any(k in data for k in ("Note", "Information")):
                note_parts = []
                for key in ("Note", "Information"):
                    if data.get(key):
                        note_parts.append(str(data[key]))
                if note_parts:
                    note = " • ".join(note_parts)
            if any(k in data for k in ("Error Message", "Error")):
                error = str(data.get("Error Message") or data.get("Error"))
        return data if isinstance(data, dict) else {}, note, error
    except Exception as exc:
        print(f"[alphav] request failed: {exc}")
        return {}, None, str(exc)


def _normalise_symbol(symbol: str) -> str:
    return symbol.strip().lstrip("$").upper()


def fetch_time_series_daily(
    symbol: str,
    *,
    limit: int = 90,
    adjusted: bool = False,
) -> Tuple[List[Dict[str, float]], Dict[str, Any]]:
    """
    Fetch TIME_SERIES_DAILY (or _ADJUSTED) for a single symbol and return
    a most-recent-first list of OHLC rows suitable for charting.
    """
    api_key = _api_key()
    if not api_key:
        return [], {"error": "ALPHAVANTAGE_KEY missing", "symbol": symbol}

    norm = _normalise_symbol(symbol)
    if not norm:
        return [], {"error": "Invalid symbol", "symbol": symbol}

    cache_key = (norm, "adjusted" if adjusted else "regular")
    now = time.time()
    cached = _CACHE.get(cache_key)
    if cached and now - cached[0] < max(60, _CACHE_TTL):
        return cached[1], cached[2]

    fn = "TIME_SERIES_DAILY_ADJUSTED" if adjusted else "TIME_SERIES_DAILY"
    params = {
        "function": fn,
        "symbol": norm,
        "outputsize": "compact" if limit <= 100 else "full",
        "datatype": "json",
        "apikey": api_key,
    }
    data, note, error = _request(params)
    series = (
        data.get("Time Series (Daily)")
        or data.get("Time Series (Digital Currency Daily)")
        or {}
    )
    meta_blob = data.get("Meta Data") or {}
    last_refreshed = meta_blob.get("3. Last Refreshed") or meta_blob.get("Last Refreshed") or ""
    meta = {
        "symbol": meta_blob.get("2. Symbol") or meta_blob.get("Symbol") or norm,
        "last_refreshed": last_refreshed,
        "note": note,
        "error": error,
    }

    if not isinstance(series, dict):
        return [], meta

    rows: List[Dict[str, float]] = []
    for date_str in sorted(series.keys())[-limit:]:
        payload = series.get(date_str) or {}
        close = payload.get("4. close") or payload.get("5. adjusted close") or payload.get("close")
        if close is None:
            continue
        try:
            close_val = float(close)
        except Exception:
            continue
        try:
            ts = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue
        row = {
            "time": int(ts.timestamp()),
            "close": round(close_val, 4),
        }
        for key, field in (
            ("1. open", "open"),
            ("2. high", "high"),
            ("3. low", "low"),
            ("5. adjusted close", "adjusted_close"),
        ):
            raw = payload.get(key)
            if raw is None:
                # Some responses use plain names rather than numbered names.
                raw = payload.get(field)
            if raw is None:
                continue
            try:
                row[field] = float(raw)
            except Exception:
                continue
        volume_raw = (
            payload.get("6. volume")
            or payload.get("5. volume")
            or payload.get("volume")
        )
        if volume_raw is not None:
            try:
                row["volume"] = float(volume_raw)
            except Exception:
                pass
        rows.append(row)

    rows.sort(key=lambda r: r["time"])
    _CACHE[cache_key] = (now, rows, meta)
    meta["points"] = len(rows)
    return rows, meta


def fetch_daily_series_bulk(
    symbols: Iterable[str],
    *,
    limit: int = 90,
    adjusted: bool = False,
) -> Dict[str, Dict[str, Any]]:
    """Helper to fetch multiple symbols with local caching."""
    out: Dict[str, Dict[str, Any]] = {}
    for sym in symbols:
        series, meta = fetch_time_series_daily(sym, limit=limit, adjusted=adjusted)
        if series or meta.get("note") or meta.get("error"):
            out[_normalise_symbol(sym)] = {"series": series, "meta": meta}
    return out
