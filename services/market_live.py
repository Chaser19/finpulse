from __future__ import annotations
import os, time, requests
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

DATE_FMT = "%Y-%m-%d"
AV_BASE = "https://www.alphavantage.co/query"
AV_KEY = lambda: os.getenv("ALPHAVANTAGE_KEY") or ""

# --- small cache to avoid throttling ---
_cache: Dict[Tuple[str, Tuple[Tuple[str, Any], ...]], Tuple[float, Any]] = {}
def _cache_get(url: str, params: Dict[str, Any], ttl: int = 60) -> Any:
    key = (url, tuple(sorted(params.items())))
    now = time.time()
    if key in _cache:
        ts, val = _cache[key]
        if now - ts < ttl:
            return val
    try:
        r = requests.get(url, params=params, timeout=20)
        r.raise_for_status()
        js = r.json()
        if isinstance(js, dict) and any(k in js for k in ("Note", "Information", "Error Message")):
            print("[market_live] AV notice:", js.get("Note") or js.get("Information") or js.get("Error Message"))
            _cache[key] = (now, None)
            return None
        _cache[key] = (now, js)
        return js
    except Exception as e:
        print("[market_live] request failed:", url, "params=", params, "err=", repr(e))
        _cache[key] = (now, None)
        return None

def _parse_pct(raw) -> Optional[float]:
    try:
        if raw is None: return None
        if isinstance(raw, str):
            s = raw.strip().replace("%", "").replace("+", "")
            s = s.strip("() ").strip()
            if raw.strip().startswith("(") and raw.strip().endswith(")"):
                return -float(s)
            return float(s)
        return float(raw)
    except Exception:
        return None

# --- Alpha Vantage: top movers / heatmap ---

def _av_top_gainers_losers() -> Dict[str, List[Dict[str, Any]]]:
    key = AV_KEY()
    if not key:
        print("[market_live] ALPHAVANTAGE_KEY missing")
        return {"gainers": [], "losers": [], "actives": []}
    js = _cache_get(AV_BASE, {"function": "TOP_GAINERS_LOSERS", "apikey": key}, ttl=60)
    if not isinstance(js, dict):
        return {"gainers": [], "losers": [], "actives": []}

    def _norm(lst):
        out = []
        if isinstance(lst, list):
            for r in lst:
                try:
                    out.append({
                        "symbol": r.get("ticker") or r.get("symbol") or "",
                        "name":  r.get("ticker") or "",
                        "pct":   _parse_pct(r.get("change_percentage")),
                        "price": float(r.get("price")) if r.get("price") is not None else None,
                    })
                except Exception:
                    continue
        return [x for x in out if x["symbol"] and x["pct"] is not None]

    return {
        "gainers": _norm(js.get("top_gainers") or js.get("top_gainers_and_losers", {}).get("top_gainers") or []),
        "losers":  _norm(js.get("top_losers")  or js.get("top_gainers_and_losers", {}).get("top_losers")  or []),
        "actives": _norm(js.get("most_actively_traded") or js.get("top_gainers_and_losers", {}).get("most_actively_traded") or []),
    }

def _av_short_series(symbol: str, points: int = 6) -> List[float]:
    """
    Optional: tiny close series for sparklines using AV TIME_SERIES_DAILY (compact).
    We keep it best-effort and cached to avoid throttle.
    """
    key = AV_KEY()
    if not key:
        return []
    js = _cache_get(AV_BASE, {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "apikey": key,
        "outputsize": "compact"
    }, ttl=90)
    if not isinstance(js, dict):
        return []
    ts = js.get("Time Series (Daily)")
    if not isinstance(ts, dict):
        return []
    closes = []
    for dt in sorted(ts.keys())[-points:]:
        row = ts[dt]
        try:
            closes.append(float(row.get("4. close") or row.get("close")))
        except Exception:
            continue
    return closes

# --- public API for Flask routes ---

def live_index_ohlc() -> Dict[str, List[Dict[str, Any]]]:
    """
    We now render index charts with TradingView client-side,
    so this can return empty without affecting the UI.
    (Kept for compatibility with existing endpoints.)
    """
    return {"SPX": [], "NDX": [], "DJI": []}

def live_top_movers() -> List[Dict[str, Any]]:
    buckets = _av_top_gainers_losers()
    pool = (buckets["gainers"][:4] + buckets["losers"][:4]) or (buckets["actives"][:8])
    seen: Dict[str, Dict[str, Any]] = {}
    for m in pool:
        s = m["symbol"]
        if s not in seen or abs(m["pct"]) > abs(seen[s]["pct"]):
            seen[s] = m
    out = list(seen.values())
    out.sort(key=lambda x: abs(x["pct"]), reverse=True)
    out = out[:8]
    for m in out:
        try:
            m["series"] = _av_short_series(m["symbol"], points=6)
        except Exception:
            m["series"] = []
    print("[market_live] movers:", len(out))
    return out

def live_heatmap(limit_each: int = 20) -> List[Dict[str, Any]]:
    buckets = _av_top_gainers_losers()
    tiles: List[Dict[str, Any]] = []

    def _take(lst):
        for r in lst[:limit_each]:
            tiles.append({
                "symbol": r["symbol"],
                "name": r.get("name") or r["symbol"],
                "pct": round(float(r["pct"]), 2) if r.get("pct") is not None else 0.0,
                "sector": ""
            })

    _take(buckets["gainers"])
    _take(buckets["losers"])
    _take(buckets["actives"])

    seen: Dict[str, Dict[str, Any]] = {}
    for t in tiles:
        s = t["symbol"]
        if s not in seen or abs(t["pct"]) > abs(seen[s]["pct"]):
            seen[s] = t

    out = list(seen.values())[:60]
    print("[heatmap] tiles:", len(out))
    return out

def live_energy_weekly() -> List[Dict[str, Any]]:
    key = AV_KEY()
    if not key:
        print("[market_live] ALPHAVANTAGE_KEY missing")
        return []
    def _series(fn: str) -> List[Dict[str, Any]]:
        js = _cache_get(AV_BASE, {"function": fn, "apikey": key}, ttl=300)
        if not isinstance(js, dict):
            return []
        if isinstance(js.get("data"), list):
            out = []
            for d in js["data"]:
                try:
                    out.append({"date": d["date"], "value": float(d["value"])})
                except Exception:
                    continue
            return out
        for k, v in js.items():
            if isinstance(v, dict) and v:
                rows = []
                for dt, inner in v.items():
                    num = None
                    for vv in inner.values():
                        try:
                            num = float(vv); break
                        except Exception:
                            continue
                    if num is not None:
                        rows.append({"date": dt, "value": num})
                return sorted(rows, key=lambda r: r["date"], reverse=True)
        return []
    def _pct_1w(data: List[Dict[str, Any]]) -> Optional[float]:
        if len(data) < 6: return None
        data_sorted = sorted(data, key=lambda r: r["date"], reverse=True)
        try:
            latest = data_sorted[0]["value"]; prior = data_sorted[5]["value"]
            if prior == 0: return None
            return (latest - prior) / prior * 100.0
        except Exception:
            return None
    rows: List[Dict[str, Any]] = []
    for name, fn in [("WTI Crude", "WTI"), ("Brent", "BRENT"), ("Nat Gas", "NATURAL_GAS")]:
        s = _series(fn)
        pct = _pct_1w(s)
        if pct is not None:
            rows.append({"name": name, "symbol": fn, "pct": round(pct, 2)})
    return rows

def todays_headlines_from_repo(news_items: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, str]]:
    today = datetime.utcnow().strftime(DATE_FMT)
    todays = [n for n in news_items if n.get("date") == today] or news_items[:limit]
    return [{"title": n.get("title", ""), "url": n.get("url") or "#"} for n in todays[:limit]]
