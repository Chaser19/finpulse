from __future__ import annotations
from collections import Counter, defaultdict
from datetime import datetime
import math
import re
from typing import Any, Dict, Iterable, List

from flask import Blueprint, current_app, render_template, request, redirect, url_for
from services.news_repo import NewsRepo
from urllib.parse import urlencode
from services.macro_trends import get_macro_trends

web_bp = Blueprint("web", __name__)


POSITIVE_WORDS = {
    "beat",
    "beats",
    "growth",
    "surge",
    "surged",
    "rally",
    "record",
    "strong",
    "improve",
    "improved",
    "improves",
    "optimistic",
    "outperform",
    "bullish",
    "gain",
    "gains",
    "advance",
}
NEGATIVE_WORDS = {
    "miss",
    "missed",
    "slump",
    "drop",
    "drops",
    "fall",
    "falls",
    "cut",
    "cuts",
    "weaker",
    "weakness",
    "concern",
    "concerns",
    "volatile",
    "selloff",
    "bearish",
    "decline",
    "declines",
    "pressure",
}

SOURCE_CREDIBILITY: Dict[str, Dict[str, str]] = {
    "reuters": {"label": "Tier 1", "description": "Wire verified", "variant": "success"},
    "bloomberg": {"label": "Tier 1", "description": "Premium reporting", "variant": "primary"},
    "wall street journal": {"label": "Tier 1", "description": "Trusted desk", "variant": "primary"},
    "wsj": {"label": "Tier 1", "description": "Trusted desk", "variant": "primary"},
    "cnbc": {"label": "Tier 2", "description": "Broadcast verified", "variant": "info"},
    "financial times": {"label": "Tier 1", "description": "Global newsroom", "variant": "primary"},
    "marketwatch": {"label": "Tier 2", "description": "Market desk", "variant": "info"},
    "seeking alpha": {"label": "Tier 3", "description": "Contributor view", "variant": "warning"},
    "investopedia": {"label": "Tier 2", "description": "Investor education", "variant": "info"},
}

TAG_CONTEXT_HINTS: Dict[str, Dict[str, Any]] = {
    "inflation": {
        "title": "Inflation lens",
        "insight": "Price pressures tie back to macro policy, so monitor CPI releases and Fed commentary.",
        "actions": [
            {"type": "macro", "label": "Open inflation dashboard", "fragment": "#inflation"},
            {"type": "news", "label": "More inflation stories", "query": "#inflation"},
        ],
    },
    "oil": {
        "title": "Energy check-in",
        "insight": "Crude swings spill into transport, energy equities, and headline inflation.",
        "actions": [
            {"type": "news", "label": "Energy coverage", "query": "#oil"},
            {"type": "macro", "label": "Energy markets view", "fragment": "#energy"},
        ],
    },
    "jobs": {
        "title": "Labour watch",
        "insight": "Employment data anchors growth expectations and consumer confidence.",
        "actions": [
            {"type": "macro", "label": "Job market dashboard", "fragment": "#job-market"},
            {"type": "news", "label": "Employment headlines", "query": "#jobs"},
        ],
    },
    "rates": {
        "title": "Rates monitor",
        "insight": "Rate volatility ripples through risk assets and FX—watch the curve closely.",
        "actions": [
            {"type": "news", "label": "Rate sensitive news", "query": "#rates"},
        ],
    },
    "esg": {
        "title": "ESG spotlight",
        "insight": "Sustainability themes are influencing capital allocation and regulation.",
        "actions": [
            {"type": "news", "label": "ESG stories", "query": "#esg"},
        ],
    },
}

NEWS_FILTER_PRESETS: List[Dict[str, Any]] = [
    {
        "label": "AI & Chips",
        "description": "Semis, AI platforms, and compute buildout.",
        "industries": [],
        "tags": ["AI", "semiconductors", "chips"],
        "tag_mode": "any",
    },
    {
        "label": "Energy & Commodities",
        "description": "Oil, gas, metals, and supply trends.",
        "industries": [],
        "tags": ["oil", "gas", "energy", "commodities"],
        "tag_mode": "any",
    },
    {
        "label": "Macro & Rates",
        "description": "Fed, inflation, growth, and FX.",
        "industries": [],
        "tags": ["inflation", "rates", "fed", "growth"],
        "tag_mode": "any",
    },
    {
        "label": "ESG Watch",
        "description": "Climate, sustainability, and governance.",
        "industries": [],
        "tags": ["esg", "sustainability", "climate"],
        "tag_mode": "any",
    },
]

def estimate_read_time(text: str) -> int:
    tokens = re.findall(r"\w+", text or "")
    if not tokens:
        return 1
    approx_words = max(len(tokens), len(tokens) * 3)
    return max(1, math.ceil(approx_words / 200))


def score_sentiment(text: str) -> Dict[str, str]:
    if not text:
        return {"label": "Neutral", "icon": "•", "variant": "secondary", "score": 0}
    lowered = text.lower()
    pos_hits = sum(1 for word in POSITIVE_WORDS if word in lowered)
    neg_hits = sum(1 for word in NEGATIVE_WORDS if word in lowered)
    delta = pos_hits - neg_hits
    score_value = delta
    if delta >= 2 or (pos_hits and not neg_hits):
        return {"label": "Bullish", "icon": "↑", "variant": "success", "score": max(score_value, 1)}
    if delta <= -2 or (neg_hits and not pos_hits):
        return {"label": "Bearish", "icon": "↓", "variant": "danger", "score": min(score_value, -1)}
    if pos_hits or neg_hits:
        return {"label": "Mixed", "icon": "↕", "variant": "warning", "score": score_value}
    return {"label": "Neutral", "icon": "•", "variant": "secondary", "score": 0}


def map_source_credibility(source: str | None) -> Dict[str, str]:
    if not source:
        return {"label": "Unrated", "description": "Source not classified", "variant": "secondary"}
    key = source.lower()
    if key in SOURCE_CREDIBILITY:
        return SOURCE_CREDIBILITY[key]
    if "blog" in key or "substack" in key:
        return {"label": "Contributor", "description": "Opinion / research note", "variant": "warning"}
    return {"label": "Unrated", "description": "Not yet classified", "variant": "secondary"}


def derive_context(tags: Iterable[str]) -> Dict[str, Any] | None:
    if not tags:
        return None
    cleaned = [t for t in tags if t]
    ticker = next((t for t in cleaned if t.isupper() and 1 < len(t) <= 5 and not t.isdigit()), None)
    if ticker:
        return {
            "kind": "ticker",
            "title": f"${ticker} in focus",
            "insight": f"{ticker} keeps cropping up in the latest coverage. Track fresh stories or sentiment next.",
            "ticker": ticker,
            "actions": [
                {"type": "news", "label": f"More news on {ticker}", "query": f"#{ticker}"},
                {"type": "social", "label": "Check social pulse", "symbol": ticker},
            ],
        }

    for tag in cleaned:
        slug = tag.lower()
        if slug in TAG_CONTEXT_HINTS:
            hint = TAG_CONTEXT_HINTS[slug].copy()
            hint.update({"kind": "macro", "tag": tag})
            return hint
    return None


def prepare_article_data(article: Dict[str, Any]) -> Dict[str, Any]:
    summary = article.get("summary") or ""
    extra = article.get("content") or ""
    read_minutes = estimate_read_time(" ".join([summary, extra]))
    sentiment = score_sentiment(f"{article.get('title', '')} {summary}")
    credibility = map_source_credibility(article.get("source"))
    context = derive_context(article.get("tags") or [])
    source_name = (article.get("source") or "Unknown").strip()
    source_words = [w for w in re.split(r"\s+", source_name) if w]
    initials = "".join(word[0] for word in source_words[:2]).upper()
    if not initials:
        initials = source_name[:2].upper() or "FP"
    prepared = dict(article)
    prepared.update(
        {
            "read_minutes": read_minutes,
            "sentiment": sentiment,
            "credibility": credibility,
            "primary_tags": (article.get("tags") or [])[:3],
            "context": context,
            "source_initials": initials,
            "source_display": source_name or "Unknown",
        }
    )
    return prepared


def cluster_articles_by_tag(items: Iterable[Dict[str, Any]], limit: int = 4) -> List[Dict[str, Any]]:
    counter: Counter[str] = Counter()
    grouping: defaultdict[str, List[Dict[str, Any]]] = defaultdict(list)
    display: Dict[str, str] = {}
    for item in items:
        seen: set[str] = set()
        for tag in item.get("tags") or []:
            if not tag:
                continue
            slug = tag.lower()
            if slug in seen:
                continue
            seen.add(slug)
            counter[slug] += 1
            grouping[slug].append(item)
            display.setdefault(slug, tag)
    clusters: List[Dict[str, Any]] = []
    for slug, count in counter.most_common():
        if count < 2:
            continue
        articles = []
        seen_ids: set[str] = set()
        for art in grouping[slug]:
            key = str(art.get("id"))
            if key in seen_ids:
                continue
            seen_ids.add(key)
            articles.append(art)
        if len(articles) < 2:
            continue
        clusters.append({"slug": slug, "tag": display.get(slug, slug), "count": count, "articles": articles})
        if len(clusters) >= limit:
            break
    return clusters


def _extract_sentiment_meta(article: Dict[str, Any]) -> tuple[float, str]:
    sentiment = article.get("sentiment") or {}
    score = sentiment.get("score")
    label = (sentiment.get("label") or "").lower()
    if score is None:
        computed = score_sentiment(f"{article.get('title', '')} {article.get('summary', '')}")
        score = computed.get("score", 0)
        label = (computed.get("label") or "").lower()
    try:
        numeric = float(score)
    except (TypeError, ValueError):
        numeric = 0.0
    return numeric, label


def _build_baseline_stats(items: Iterable[Dict[str, Any]] | None) -> tuple[Dict[str, Dict[str, float]], int]:
    stats: Dict[str, Dict[str, float]] = {}
    total = 0
    if not items:
        return stats, total
    for article in items:
        category = article.get("category")
        if not category or category == "System":
            continue
        total += 1
        entry = stats.setdefault(category, {"count": 0, "sentiment_sum": 0.0})
        entry["count"] += 1
        score, _ = _extract_sentiment_meta(article)
        entry["sentiment_sum"] += score
    return stats, total


def compute_on_radar(
    items: Iterable[Dict[str, Any]],
    *,
    baseline_items: Iterable[Dict[str, Any]] | None = None,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    category_stats: Dict[str, Dict[str, Any]] = {}
    category_buckets: defaultdict[str, List[Dict[str, Any]]] = defaultdict(list)
    total = 0

    for article in items:
        category = article.get("category")
        if not category or category == "System":
            continue
        total += 1
        category_buckets[category].append(article)
        stat = category_stats.setdefault(
            category,
            {
                "count": 0,
                "sentiment_sum": 0.0,
                "bullish": 0,
                "bearish": 0,
                "tags": Counter(),
                "tag_display": {},
            },
        )
        stat["count"] += 1
        score, label = _extract_sentiment_meta(article)
        stat["sentiment_sum"] += score
        if label == "bullish":
            stat["bullish"] += 1
        elif label == "bearish":
            stat["bearish"] += 1

        for tag in article.get("tags") or []:
            if not tag:
                continue
            slug = tag.lower()
            stat["tags"][slug] += 1
            stat["tag_display"].setdefault(slug, tag)

    if not total:
        return []

    baseline_stats, baseline_total = _build_baseline_stats(baseline_items or [])
    if baseline_total == 0:
        baseline_stats, baseline_total = _build_baseline_stats(items)

    results: List[Dict[str, Any]] = []
    for category, stat in category_stats.items():
        count = stat["count"]
        share = count / total if total else 0.0
        bucket = category_buckets[category]

        baseline_entry = baseline_stats.get(category, {"count": 0, "sentiment_sum": 0.0})
        baseline_count = baseline_entry.get("count", 0)
        baseline_share = (baseline_count / baseline_total) if baseline_total else 0.0

        sentiment_avg = (stat["sentiment_sum"] / count) if count else 0.0
        baseline_sentiment_avg = (
            (baseline_entry.get("sentiment_sum", 0.0) / baseline_count) if baseline_count else 0.0
        )

        sentiment_delta = sentiment_avg - baseline_sentiment_avg
        volume_delta = share - baseline_share

        tag_counter: Counter[str] = stat.get("tags") or Counter()
        display_map: Dict[str, str] = stat.get("tag_display") or {}
        top_tags = [display_map[slug] for slug, _ in tag_counter.most_common(3) if slug in display_map]
        headline = bucket[0].get("title") if bucket else ""

        results.append(
            {
                "category": category,
                "count": count,
                "share": share,
                "share_baseline": baseline_share,
                "volume_delta": volume_delta,
                "sentiment_avg": sentiment_avg,
                "sentiment_delta": sentiment_delta,
                "bullish": stat["bullish"],
                "bearish": stat["bearish"],
                "top_tags": top_tags,
                "headline": headline,
                "momentum_score": abs(volume_delta) * 100 + abs(sentiment_delta) * 3,
            }
        )

    results.sort(key=lambda item: item["momentum_score"], reverse=True)
    return results[:limit]


def compute_quick_tags(items: Iterable[Dict[str, Any]], limit: int = 8) -> List[Dict[str, Any]]:
    counter: Counter[str] = Counter()
    display: Dict[str, str] = {}
    for item in items:
        for tag in item.get("tags") or []:
            if not tag:
                continue
            slug = tag.lower()
            counter[slug] += 1
            display.setdefault(slug, tag)
    return [{"tag": display[slug], "count": counter[slug]} for slug, _ in counter.most_common(limit)]


def repo() -> NewsRepo:
    return NewsRepo(current_app.config["DATA_PATH"])  # lightweight per-request helper

def get_social_handles() -> list[str]:
    raw = (current_app.config.get("SOCIAL_TWITTER_ACCOUNTS") or "").strip()
    if not raw:
        return []
    # Support comma or whitespace separated
    parts: list[str] = []
    for token in raw.replace("\n", ",").replace(" ", ",").split(","):
        h = token.strip().lstrip("@")
        if h:
            parts.append(h)
    # de-duplicate preserving order
    seen = set()
    uniq = []
    for h in parts:
        if h not in seen:
            seen.add(h)
            uniq.append(h)
    return uniq

def get_scrape_user() -> str:
    cfg = (current_app.config.get("SOCIAL_TWITTER_SCRAPE_USER") or "").strip().lstrip("@")
    if cfg:
        return cfg
    hs = get_social_handles()
    return hs[0] if hs else ""

@web_bp.route("/")
def index():
    categories = repo().list_categories()
    social_handles = get_social_handles()
    scrape_user = get_scrape_user()
    return render_template("index.html", categories=categories, social_handles=social_handles, scrape_user=scrape_user)


@web_bp.route("/news")
def news_list():
    r = repo()
    categories = r.list_categories()

    active_tag = request.args.get("tag")
    q = request.args.get("q", "").strip()
    selected_industries = request.args.getlist("industries")
    selected_tags = request.args.getlist("tags")
    tag_mode = request.args.get("tag_mode", "any") or "any"

    combined_industries: list[str] = []
    for value in selected_industries + ([active_tag] if active_tag else []):
        if value and value not in combined_industries:
            combined_industries.append(value)

    raw_items = r.query_curated(
        industries=combined_industries or None,
        tags=selected_tags or None,
        tag_mode=tag_mode,
        q=q or None,
    )

    raw_ids = {str(item.get("id")) for item in raw_items}
    baseline_pool_all = r.list_all()
    baseline_pool = [item for item in baseline_pool_all if str(item.get("id")) not in raw_ids]

    enriched_items = [prepare_article_data(n) for n in raw_items]
    top_tags = r.list_top_tags(limit=30)

    def build_news_url(**kwargs):
        params = {k: list(v) for k, v in request.args.lists()}
        for key, value in kwargs.items():
            if value is None or value is False:
                params.pop(key, None)
            elif isinstance(value, list):
                params[key] = value
            else:
                params[key] = [value]
        query = urlencode(params, doseq=True)
        base = url_for("web.news_list")
        return f"{base}?{query}" if query else base

    for article in enriched_items:
        context = article.get("context")
        if not context:
            continue
        actions = context.get("actions") or []
        resolved: List[Dict[str, str]] = []
        for action in actions:
            kind = action.get("type")
            href = None
            if kind == "news":
                href = build_news_url(q=action.get("query"))
            elif kind == "social":
                symbol = action.get("symbol")
                if symbol:
                    href = f"{url_for('web.social')}?symbol={symbol}"
            elif kind == "macro":
                fragment = action.get("fragment") or ""
                href = url_for("web.macro_trends") + fragment
            else:
                href = action.get("href")
            if href:
                resolved.append({"label": action.get("label", "Open"), "href": href})
        context["actions"] = resolved
        article["context"] = context

    story_clusters_raw = cluster_articles_by_tag(enriched_items, limit=2)
    story_clusters = []
    for cluster in story_clusters_raw:
        primary = cluster["articles"][0]
        related = cluster["articles"][1:4]
        cluster_href = build_news_url(q=f"#{cluster['tag']}")
        bullets = []
        for rel in related:
            bullets.append(
                {
                    "title": rel.get("title"),
                    "summary": rel.get("summary"),
                    "href": rel.get("url") or cluster_href,
                }
            )
        story_clusters.append(
            {
                "tag": cluster["tag"],
                "count": cluster["count"],
                "primary": primary,
                "href": cluster_href,
                "bullets": bullets,
            }
        )

    def classify_trend(delta: float, threshold: float) -> str:
        if delta > threshold:
            return "up"
        if delta < -threshold:
            return "down"
        return "flat"

    def describe_sentiment(avg: float, bullish: int, bearish: int, total: int) -> tuple[str, str]:
        bull_ratio = (bullish / total) if total else 0.0
        bear_ratio = (bearish / total) if total else 0.0
        if avg >= 1.0 or bull_ratio >= 0.55:
            return "Bullish momentum", "success"
        if avg <= -1.0 or bear_ratio >= 0.55:
            return "Bearish pressure", "danger"
        if avg >= 0.4 or bull_ratio >= 0.4:
            return "Positive tilt", "info"
        if avg <= -0.4 or bear_ratio >= 0.4:
            return "Negative tilt", "warning"
        return "Mixed tone", "secondary"

    on_radar_entries: List[Dict[str, Any]] = []
    for entry in compute_on_radar(enriched_items, baseline_items=baseline_pool, limit=3):
        entry = dict(entry)
        entry["href"] = build_news_url(tag=entry["category"])
        entry["share_display"] = f"{entry['share'] * 100:.1f}%"
        entry["baseline_share_display"] = f"{entry['share_baseline'] * 100:.1f}%"
        entry["sentiment_avg_display"] = f"{entry['sentiment_avg']:+.1f}"
        entry["sentiment_delta_display"] = f"{entry['sentiment_delta']:+.1f}"
        entry["volume_delta_display"] = f"{entry['volume_delta'] * 100:+.1f}pp"
        volume_trend = classify_trend(entry["volume_delta"], 0.01)
        sentiment_trend = classify_trend(entry["sentiment_delta"], 0.15)
        entry["volume_trend"] = volume_trend
        entry["sentiment_trend"] = sentiment_trend
        entry["momentum_variant"] = volume_trend
        tone_label, tone_variant = describe_sentiment(
            entry["sentiment_avg"], entry["bullish"], entry["bearish"], entry["count"]
        )
        entry["tone_label"] = tone_label
        entry["tone_variant"] = tone_variant
        entry["top_tag_links"] = [
            {
                "tag": tag,
                "href": build_news_url(q=f"#{tag}"),
            }
            for tag in entry.get("top_tags", [])
        ]
        on_radar_entries.append(entry)

    quick_tags = []
    for tag in compute_quick_tags(enriched_items, limit=8):
        quick_tags.append(
            {
                "tag": tag["tag"],
                "count": tag["count"],
                "href": build_news_url(q=f"#{tag['tag']}"),
            }
        )

    preset_links = []
    current_tags_normalised = {t.lower().lstrip("#") for t in selected_tags}
    current_industries = {s.lower() for s in combined_industries}
    for preset in NEWS_FILTER_PRESETS:
        kwargs: Dict[str, Any] = {}
        if preset.get("industries"):
            kwargs["industries"] = preset["industries"]
        if preset.get("tags"):
            kwargs["tags"] = preset["tags"]
        if preset.get("tag_mode"):
            kwargs["tag_mode"] = preset["tag_mode"]
        if preset.get("q"):
            kwargs["q"] = preset["q"]

        href = build_news_url(**kwargs)

        preset_tags_norm = {t.lower().lstrip("#") for t in (preset.get("tags") or [])}
        preset_inds_norm = {s.lower() for s in (preset.get("industries") or [])}
        is_active = False
        if preset_tags_norm:
            is_active = preset_tags_norm.issubset(current_tags_normalised)
        if preset_inds_norm:
            is_active = is_active or preset_inds_norm.issubset(current_industries)

        preset_links.append(
            {
                "label": preset["label"],
                "description": preset.get("description", ""),
                "href": href,
                "active": is_active,
            }
        )

    display_items = [
        article
        for article in enriched_items
        if article.get("category") != "System" and not str(article.get("id") or "").startswith("system:")
    ]
    visible_count = len(display_items)

    refreshed_display: str | None = None
    try:
        refreshed_dt = datetime.fromtimestamp(r.path.stat().st_mtime)
        refreshed_display = refreshed_dt.strftime("%b %d, %Y %I:%M %p")
    except Exception:
        refreshed_display = None

    return render_template(
        "news.html",
        news_items=display_items,
        news_total=visible_count,
        active_tag=active_tag,
        q=q,
        categories=categories,
        selected_industries=combined_industries,
        selected_tags=selected_tags,
        tag_mode=tag_mode,
        top_tags=top_tags,
        build_news_url=build_news_url,
        story_clusters=story_clusters,
        on_radar=on_radar_entries,
        quick_tags=quick_tags,
        filter_presets=preset_links,
        news_refreshed=refreshed_display,
    )

@web_bp.route("/curated")
def curated():
    query = request.query_string.decode()
    target = url_for("web.news_list")
    if query:
        target = f"{target}?{query}"
    return redirect(target)


@web_bp.route("/social")
def social():
    """Social insights page (embeds timelines from configured accounts)."""
    handles = get_social_handles()
    scrape_user = get_scrape_user()
    return render_template("social.html", handles=handles, scrape_user=scrape_user)


@web_bp.route("/macro-trends")
def macro_trends():
    cfg = current_app.config
    data = get_macro_trends(
        fred_api_key=cfg.get("FRED_API_KEY", ""),
        eia_api_key=cfg.get("EIA_API_KEY", ""),
    )

    updated_raw = data.get("updated")
    updated_display: str | None = None
    if updated_raw:
        try:
            updated_dt = datetime.fromisoformat(updated_raw)
            updated_display = updated_dt.strftime("%b %d, %Y %I:%M %p")
        except ValueError:
            updated_display = updated_raw

    categories = data.get("categories") or []

    return render_template(
        "macro_trends.html",
        macro_categories=categories,
        macro_updated=updated_display,
    )
