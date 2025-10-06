from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
import certifi


API_BASE = "https://finnhub.io/api/v1"
_quote_cache: Dict[str, Tuple[float, Optional[Dict[str, Any]]]] = {}
_candle_cache: Dict[Tuple[str, str, int], Tuple[float, Optional[List[Dict[str, Any]]]]] = {}
_profile_cache: Dict[str, Tuple[float, Optional[Dict[str, Any]]]] = {}
_ca_bundle: Optional[str] = None
_warned_resources: set[Tuple[str, str]] = set()


def _api_key() -> str:
    return os.getenv("FINNHUB_KEY", "").strip()


def _resolve_ca_bundle() -> str:
    global _ca_bundle
    if _ca_bundle:
        return _ca_bundle

    for env_key in ("REQUESTS_CA_BUNDLE", "SSL_CERT_FILE"):
        candidate = os.getenv(env_key, "").strip()
        if candidate and Path(candidate).exists():
            _ca_bundle = candidate
            return _ca_bundle

    _ca_bundle = certifi.where()
    return _ca_bundle


def _cached_request(key, ttl: int, fn):
    now = time.time()
    cached = key in fn["cache"] and fn["cache"][key]
    if cached:
        ts, payload = cached
        if now - ts < ttl:
            return payload
    try:
        payload = fn["call"]()
    except Exception as exc:
        print("[finnhub] request failed", key, exc)
        payload = None
    fn["cache"][key] = (now, payload)
    return payload


def get_quote(symbol: str, ttl: int = 30) -> Optional[Dict[str, Any]]:
    key = _api_key()
    if not key or not symbol:
        return None

    cache_key = symbol.upper()

    def _do_request() -> Optional[Dict[str, Any]]:
        resp = requests.get(
            f"{API_BASE}/quote",
            params={"symbol": symbol.upper(), "token": key},
            timeout=10,
            verify=_resolve_ca_bundle(),
        )
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or not data.get("c"):
            return None
        return data

    return _cached_request(cache_key, ttl, {"cache": _quote_cache, "call": _do_request})


def get_profile(symbol: str, ttl: int = 3600) -> Optional[Dict[str, Any]]:
    key = _api_key()
    if not key or not symbol:
        return None

    cache_key = symbol.upper()

    def _do_request() -> Optional[Dict[str, Any]]:
        resp = requests.get(
            f"{API_BASE}/stock/profile2",
            params={"symbol": symbol.upper(), "token": key},
            timeout=10,
            verify=_resolve_ca_bundle(),
        )
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or not data.get("ticker"):
            return None
        return data

    return _cached_request(cache_key, ttl, {"cache": _profile_cache, "call": _do_request})


def get_price_history(
    symbol: str,
    resolution: str = "30",
    hours: int = 24,
    ttl: int = 120,
) -> List[Dict[str, Any]]:
    key = _api_key()
    if not key or not symbol:
        return []

    now = int(time.time())
    # Align the upper timestamp to the current resolution window to boost cache hits
    if resolution.isdigit():
        step = int(resolution) * 60
    else:
        step = 60 * 30
    to_ts = now - (now % step)
    from_ts = to_ts - max(1, hours) * 3600
    cache_key = (symbol.upper(), resolution, from_ts)

    def _do_request() -> Optional[List[Dict[str, Any]]]:
        try:
            resp = requests.get(
                f"{API_BASE}/stock/candle",
                params={
                    "symbol": symbol.upper(),
                    "resolution": resolution,
                    "from": from_ts,
                    "to": to_ts,
                    "token": key,
                },
                timeout=10,
                verify=_resolve_ca_bundle(),
            )
            resp.raise_for_status()
        except requests.HTTPError as exc:
            body = exc.response.text if exc.response is not None else ""
            warn_key = (symbol.upper(), resolution)
            if warn_key not in _warned_resources:
                _warned_resources.add(warn_key)
                status = exc.response.status_code if exc.response is not None else "?"
                print(
                    "[finnhub] candle error",
                    symbol.upper(),
                    resolution,
                    status,
                    body[:120],
                )
            raise
        data = resp.json()
        if not isinstance(data, dict) or data.get("s") != "ok":
            return None
        closes = data.get("c") or []
        times = data.get("t") or []
        if not isinstance(closes, list) or not isinstance(times, list):
            return None
        out: List[Dict[str, Any]] = []
        for ts, close in zip(times, closes):
            try:
                out.append({"time": int(ts), "close": float(close)})
            except Exception:
                continue
        return out

    data = _cached_request(cache_key, ttl, {"cache": _candle_cache, "call": _do_request})
    if data:
        return data

    if resolution != "D":
        # Finnhub free tier may block intraday data; fall back to daily bars.
        return get_price_history(symbol, resolution="D", hours=max(24, hours), ttl=ttl)

    return []
