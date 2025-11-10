# services/social_ingest.py
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence
import requests

from services.alpha_vantage import fetch_daily_series_bulk
from services.sample_social_data import get_sample_symbol_posts
from services.tradingview import fetch_snapshots as fetch_tradingview_snapshots
from services.twitter_auth import normalize_bearer_token

MAX_HISTORY_POINTS = 60


@dataclass
class SocialPost:
    id: str
    source: str
    symbol: str
    author: str
    url: str
    created_at: str
    text: str
    like_count: int | None = None
    reply_count: int | None = None
    repost_count: int | None = None
    weight: float | None = None
    engagement_level: str | None = None


def _iso_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def _safe_int(value: object) -> int | None:
    try:
        return int(value)  # type: ignore[arg-type]
    except Exception:
        return None


def _compute_weight(post: SocialPost) -> float:
    base = naive_sentiment(post.text)
    if base == 0:
        return 0.0
    likes = max(0, post.like_count or 0)
    reposts = max(0, post.repost_count or 0)
    amplification = 1 + likes * 0.02 + reposts * 0.05
    return round(base * amplification, 4)


def _engagement_level(post: SocialPost) -> str:
    likes = max(0, post.like_count or 0)
    reposts = max(0, post.repost_count or 0)
    if likes >= 60 or reposts >= 20:
        return "high"
    if likes >= 25 or reposts >= 8:
        return "medium"
    return "low"


def _annotate_posts(posts: List[SocialPost]) -> List[SocialPost]:
    for post in posts:
        post.weight = _compute_weight(post)
        post.engagement_level = _engagement_level(post)
    return posts


def _top_posts(posts: Sequence[SocialPost], *, limit: int = 5) -> List[Dict[str, Any]]:
    ranked = sorted(posts, key=lambda p: abs(p.weight or 0), reverse=True)
    top: List[Dict[str, Any]] = []
    for post in ranked:
        if len(top) >= limit:
            break
        weight = round(post.weight or 0, 2)
        sentiment = "bullish" if weight > 0 else "bearish" if weight < 0 else "neutral"
        top.append(
            {
                "id": post.id,
                "author": post.author,
                "created_at": post.created_at,
                "text": post.text,
                "url": post.url,
                "weight": weight,
                "sentiment": sentiment,
                "like_count": post.like_count,
                "repost_count": post.repost_count,
                "engagement_level": post.engagement_level,
            }
        )
    return top


def _sample_social_posts(normalized_symbol: str, limit: int | None) -> List[SocialPost]:
    raw_posts = get_sample_symbol_posts(normalized_symbol)
    if limit and limit > 0:
        raw_posts = raw_posts[:limit]

    posts: List[SocialPost] = []
    for raw in raw_posts:
        try:
            posts.append(SocialPost(**raw))
        except TypeError:
            # Skip malformed entries silently; fixtures may evolve.
            continue
    return posts


def _query_posts_twitter_api(
    normalized_symbol: str,
    *,
    bearer_token: str,
    limit: int,
    lookback_hours: int,
) -> List[SocialPost]:
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = {
        "Authorization": f"Bearer {bearer_token.strip()}",
        "User-Agent": "FinPulse/1.0",
    }
    params = {
        "query": f"${normalized_symbol} lang:en",
        "tweet.fields": "created_at,lang,public_metrics",
        "expansions": "author_id",
        "user.fields": "username,name",
    }
    if lookback_hours > 0:
        start = datetime.utcnow() - timedelta(hours=lookback_hours)
        params["start_time"] = start.replace(microsecond=0).isoformat() + "Z"

    posts: List[SocialPost] = []
    next_token: str | None = None
    remaining = max(1, int(limit))

    while remaining > 0:
        params["max_results"] = max(10, min(remaining, 100))
        if next_token:
            params["next_token"] = next_token
        elif "next_token" in params:
            params.pop("next_token")

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
        except Exception as exc:
            print(f"[social] Twitter API request failed: {exc}")
            return []

        if resp.status_code == 429:
            reset = resp.headers.get("x-rate-limit-reset")
            remain = resp.headers.get("x-rate-limit-remaining")
            window = resp.headers.get("x-rate-limit-limit")
            meta = f"remaining={remain or '?'} window={window or '?'}"
            if reset:
                print(
                    f"[social] Twitter API rate limited (resets at {reset}; {meta}); returning partial results"
                )
            else:
                print(f"[social] Twitter API rate limited ({meta}); returning partial results")
            return posts

        if resp.status_code != 200:
            snippet = resp.text.strip().replace("\n", " ")[:200]
            print(f"[social] Twitter API HTTP {resp.status_code}: {snippet}")
            return []

        payload = resp.json()
        data = payload.get("data", [])
        if not data:
            break

        users = {u["id"]: u for u in payload.get("includes", {}).get("users", [])}

        for tweet in data:
            author_obj = users.get(tweet.get("author_id", "")) if tweet.get("author_id") else {}
            username = author_obj.get("username", "") if isinstance(author_obj, dict) else ""
            created_at_str = tweet.get("created_at")
            if created_at_str:
                try:
                    created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                except ValueError:
                    created_dt = datetime.utcnow()
            else:
                created_dt = datetime.utcnow()

            metrics = tweet.get("public_metrics", {}) or {}
            posts.append(
                SocialPost(
                    id=str(tweet.get("id", "")),
                    source="x",
                    symbol=normalized_symbol,
                    author=username,
                    url=f"https://twitter.com/{username}/status/{tweet.get('id')}" if username else f"https://twitter.com/i/web/status/{tweet.get('id')}",
                    created_at=_iso_utc(created_dt),
                    text=str(tweet.get("text", "")),
                    like_count=_safe_int(metrics.get("like_count")),
                    reply_count=_safe_int(metrics.get("reply_count")),
                    repost_count=_safe_int(metrics.get("retweet_count")),
                )
            )

        remaining = limit - len(posts)
        next_token = payload.get("meta", {}).get("next_token")
        if not next_token:
            break

    return posts[:limit]


def fetch_x_symbol_posts(
    symbol: str,
    *,
    limit: int = 50,
    lookback_hours: int = 12,
    bearer_token: str | None = None,
) -> List[SocialPost]:
    normalized_symbol = symbol.strip().lstrip("$").upper()
    raw_token = (
        bearer_token
        or os.getenv("SOCIAL_TWITTER_BEARER_TOKEN")
        or os.getenv("TWITTER_BEARER_TOKEN")
    )
    token = normalize_bearer_token(raw_token)

    if not token:
        sample_posts = _sample_social_posts(normalized_symbol, None)
        if sample_posts:
            print(f"[social] Using sample tweets for ${normalized_symbol}")
            return _annotate_posts(sample_posts)
        print(
            f"[social] Twitter API bearer token missing; skipping ${normalized_symbol}"
        )
        return []

    posts = _query_posts_twitter_api(
        normalized_symbol,
        bearer_token=token,
        limit=limit,
        lookback_hours=lookback_hours,
    )
    if posts:
        print(f"[social] Twitter API returned {len(posts)} posts for ${normalized_symbol}")
        return _annotate_posts(posts)

    sample_posts = _sample_social_posts(normalized_symbol, None)
    if sample_posts:
        print(
            f"[social] Twitter API returned no posts for ${normalized_symbol}, using sample tweets"
        )
        return _annotate_posts(sample_posts)
    return []


def fetch_stocktwits_symbol(symbol: str, *, limit: int = 50) -> List[SocialPost]:
    """Fetch recent messages from StockTwits public API for a symbol (no key)."""
    sym = symbol.strip().lstrip("$").upper()
    url = f"https://api.stocktwits.com/api/2/streams/symbol/{sym}.json"
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36 FinPulse/1.0",
            "Accept": "application/json",
        }
        params = {"limit": max(1, min(50, int(limit or 30)))}
        r = requests.get(url, headers=headers, params=params, timeout=12)
        if r.status_code != 200:
            print(f"[social] StockTwits HTTP {r.status_code} for {url}")
            return []
        data = r.json()
        msgs = data.get("messages", [])
        posts: List[SocialPost] = []
        for m in msgs[:limit]:
            body = m.get("body", "")
            created_at = m.get("created_at") or datetime.utcnow().isoformat()
            user = (m.get("user") or {}).get("username", "")
            mid = m.get("id")
            purl = m.get("source", {}).get("url") or f"https://stocktwits.com/{user}/message/{mid}" if mid else ""
            posts.append(
                SocialPost(
                    id=str(mid or ""),
                    source="stocktwits",
                    symbol=sym,
                    author=user or "",
                    url=purl,
                    created_at=created_at,
                    text=body,
                    like_count=None,
                    reply_count=None,
                    repost_count=None,
                )
            )
        return _annotate_posts(posts)
    except Exception as e:
        print(f"[social] StockTwits fetch failed for {sym}: {e}")
        return []


def naive_sentiment(text: str) -> float:
    lowered = text.lower()
    positive = ("bull", "bullish", "buy", "call", "moon", "green", "long")
    negative = ("bear", "bearish", "sell", "put", "red", "short", "dump")
    score = 0.0
    for token in positive:
        if token in lowered:
            score += 1.0
    for token in negative:
        if token in lowered:
            score -= 1.0
    return score


def summarize_sentiment(posts: Iterable[SocialPost]) -> Dict[str, float | int]:
    total = 0
    bullish = 0.0
    bearish = 0.0
    bullish_posts = 0
    bearish_posts = 0
    neutral_posts = 0
    engagement_breakdown: Dict[str, int] = {"high": 0, "medium": 0, "low": 0}

    for post in posts:
        total += 1
        weight = post.weight if post.weight is not None else naive_sentiment(post.text)
        level = post.engagement_level or "low"
        engagement_breakdown[level] = engagement_breakdown.get(level, 0) + 1

        if weight > 0:
            bullish += weight
            bullish_posts += 1
        elif weight < 0:
            bearish += abs(weight)
            bearish_posts += 1
        else:
            neutral_posts += 1
    net = bullish - bearish
    return {
        "posts": total,
        "bullish_score": round(bullish, 2),
        "bearish_score": round(bearish, 2),
        "net_score": round(net, 2),
        "bullish_posts": bullish_posts,
        "bearish_posts": bearish_posts,
        "neutral_posts": neutral_posts,
        "engagement_breakdown": engagement_breakdown,
    }


def ingest_social(
    output_path: str | Path,
    symbols: Sequence[str],
    *,
    max_posts: int = 50,
    lookback_hours: int = 12,
    twitter_bearer_token: str | None = None,
) -> Dict[str, dict]:
    path = Path(output_path)
    existing_payload: Dict[str, Any] = {}
    if path.exists():
        try:
            existing_payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            existing_payload = {}

    history_map: Dict[str, List[Dict[str, Any]]] = existing_payload.get("history", {}) or {}

    normalized_symbols = [s.strip().lstrip("$") for s in symbols if s and s.strip()]
    tv_metrics = fetch_tradingview_snapshots(normalized_symbols)
    alpha_histories = fetch_daily_series_bulk(normalized_symbols, limit=90)

    results: Dict[str, dict] = {}
    now_iso = _iso_utc(datetime.utcnow())

    for sym in normalized_symbols:
        if not sym:
            continue
        posts = fetch_x_symbol_posts(
            sym,
            limit=max_posts,
            lookback_hours=lookback_hours,
            bearer_token=twitter_bearer_token,
        )
        # Fallback to StockTwits if X yields nothing
        if not posts:
            print(f"[social] Falling back to StockTwits for ${sym}")
            posts = fetch_stocktwits_symbol(sym, limit=max_posts)
        summary = summarize_sentiment(posts)
        breakdown = summary.get("engagement_breakdown", {})
        summary["engagement_breakdown"] = {
            "high": breakdown.get("high", 0),
            "medium": breakdown.get("medium", 0),
            "low": breakdown.get("low", 0),
        }
        summary["top_posts"] = _top_posts(posts, limit=5)

        symbol_key = sym.upper()

        price_snapshot = dict(tv_metrics.get(symbol_key, {}))

        alpha_payload = alpha_histories.get(symbol_key) or {}
        alpha_history = alpha_payload.get("series") or []
        alpha_meta = alpha_payload.get("meta") or {}
        if alpha_history:
            latest = alpha_history[-1]
            prev = alpha_history[-2] if len(alpha_history) > 1 else None
            close_val = latest.get("close")
            if close_val is not None:
                price_snapshot.setdefault("close", round(close_val, 2))
            if prev and prev.get("close"):
                delta = (close_val or 0) - prev["close"]
                price_snapshot.setdefault("change_abs", round(delta, 2))
                if prev["close"] != 0:
                    pct = (delta / prev["close"]) * 100
                    price_snapshot.setdefault("change_pct", round(pct, 2))
            ts_candidate = latest.get("time")
            if ts_candidate and not price_snapshot.get("timestamp"):
                price_snapshot["timestamp"] = ts_candidate
            price_snapshot["history"] = alpha_history
            price_snapshot["history_resolution"] = "1d"
            price_snapshot["history_source"] = "alphavantage"
            price_snapshot["history_lookback_hours"] = len(alpha_history) * 24
            price_snapshot.setdefault("currency", "USD")
            price_snapshot.setdefault("source", "alphavantage")
        if alpha_meta.get("note"):
            price_snapshot["history_note"] = alpha_meta["note"]
        if alpha_meta.get("error"):
            price_snapshot["history_error"] = alpha_meta["error"]
        if alpha_meta.get("last_refreshed"):
            price_snapshot["history_last_refreshed"] = alpha_meta["last_refreshed"]

        history_entries = history_map.get(symbol_key, [])
        history_entries.append(
            {
                "timestamp": now_iso,
                "net_score": summary.get("net_score", 0),
                "bullish_score": summary.get("bullish_score", 0),
                "bearish_score": summary.get("bearish_score", 0),
                "posts": summary.get("posts", 0),
                "change_pct": price_snapshot.get("change_pct"),
                "close": price_snapshot.get("close"),
                "volume": price_snapshot.get("volume"),
            }
        )
        history_map[symbol_key] = history_entries[-MAX_HISTORY_POINTS:]

        results[symbol_key] = {
            "summary": summary,
            "posts": [asdict(p) for p in posts],
            "history": history_map[symbol_key],
            "price": price_snapshot,
        }

    payload = {
        "generated_at": now_iso,
        "symbols": results,
        "history": history_map,
    }

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload
