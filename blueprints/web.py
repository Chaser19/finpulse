from __future__ import annotations
from collections import Counter, defaultdict
from datetime import datetime, time, timedelta
import math
import re
from typing import Any, Dict, Iterable, List
from zoneinfo import ZoneInfo

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
        "id": "market-pulse",
        "label": "Market Pulse",
        "description": "Index moves, breadth, and flows.",
        "industries": ["Markets"],
        "tags": ["Financial Markets", "Equities", "NASDAQ", "$NYSE"],
        "tag_mode": "any",
    },
    {
        "id": "earnings-guidance",
        "label": "Earnings & Guidance",
        "description": "Quarterly results and management outlooks.",
        "industries": ["Markets"],
        "tags": ["Earnings", "$CEO"],
        "tag_mode": "any",
    },
    {
        "id": "tech-ai",
        "label": "Tech & AI",
        "description": "Enterprise AI, chips, and platform shifts.",
        "industries": ["Markets"],
        "tags": ["Technology", "$AI"],
        "tag_mode": "any",
    },
    {
        "id": "energy-commodities",
        "label": "Energy & Commodities",
        "description": "Oil, transport, and resource supply.",
        "industries": ["Markets"],
        "tags": ["Energy & Transportation", "Oil"],
        "tag_mode": "any",
    },
    {
        "id": "macro-rates",
        "label": "Macro & Rates",
        "description": "Growth data, policy, and the curve.",
        "industries": ["Markets"],
        "tags": ["Economy - Monetary", "$GDP", "Rates", "Fed"],
        "tag_mode": "any",
    },
    {
        "id": "inflation-watch",
        "label": "Inflation Watch",
        "description": "Price pressures and cost dynamics.",
        "industries": ["Markets"],
        "tags": ["Inflation"],
        "tag_mode": "any",
    },
    {
        "id": "policy-regulation",
        "label": "Policy & Regulation",
        "description": "Capitol Hill and rulemaking.",
        "industries": ["Policy"],
        "tags": ["Policy", "Government"],
        "tag_mode": "any",
    },
    {
        "id": "geopolitics-trade",
        "label": "Geopolitics & Trade",
        "description": "Tariffs, alliances, and conflict risk.",
        "industries": ["Policy", "Geopolitics"],
        "tags": ["Geopolitics", "Tariffs"],
        "tag_mode": "any",
    },
    {
        "id": "consumer-retail",
        "label": "Consumer & Retail",
        "description": "Household demand and retail trends.",
        "industries": ["Markets"],
        "tags": ["Retail & Wholesale"],
        "tag_mode": "any",
    },
    {
        "id": "banking-credit",
        "label": "Banking & Credit",
        "description": "Banks, funding, and balance sheets.",
        "industries": ["Markets"],
        "tags": ["Finance"],
        "tag_mode": "any",
    },
    {
        "id": "health-life-sciences",
        "label": "Life Sciences & Healthcare",
        "description": "Biotech breakthroughs and health policy.",
        "industries": ["Markets"],
        "tags": ["Life Sciences"],
        "tag_mode": "any",
    },
    {
        "id": "real-assets-housing",
        "label": "Real Assets & Housing",
        "description": "Property markets and construction flows.",
        "industries": ["Markets"],
        "tags": ["Real Estate & Construction"],
        "tag_mode": "any",
    },
    {
        "id": "global-equities",
        "label": "Global Equities",
        "description": "Regional benchmarks and cross-border moves.",
        "industries": ["Markets"],
        "tags": ["$US", "$UK", "$TSX"],
        "tag_mode": "any",
    },
    {
        "id": "etf-passive",
        "label": "ETFs & Passive",
        "description": "Fund flows and product launches.",
        "industries": ["Markets"],
        "tags": ["$ETF"],
        "tag_mode": "any",
    },
    {
        "id": "crypto-digital",
        "label": "Crypto & Digital Assets",
        "description": "Blockchain, tokens, and digital finance.",
        "industries": ["Markets"],
        "tags": ["Blockchain"],
        "tag_mode": "any",
    },
    {
        "id": "manufacturing-industrials",
        "label": "Manufacturing & Industrials",
        "description": "Factories, logistics, and capex.",
        "industries": ["Markets"],
        "tags": ["Manufacturing", "Energy & Transportation"],
        "tag_mode": "any",
    },
]
NEWS_FILTER_PRESET_INDEX: Dict[str, Dict[str, Any]] = {
    preset["id"]: preset for preset in NEWS_FILTER_PRESETS
}

THEME_DESCRIPTIONS: Dict[str, str] = {
    "markets": "Broad market pulse & earnings",
    "macro": "Growth, jobs, & economic signals",
    "inflation": "Prices & rate expectations",
    "rates": "Yield curve, credit, & funding costs",
    "commodities": "Metals, ags, & materials flows",
    "energy": "Supply, demand, & infrastructure",
    "policy": "Fiscal moves, regulation & legislation",
    "geopolitics": "Diplomacy, conflict, & global risk",
    "finance": "Banking, deals, & capital markets",
}

MARKET_TZ = ZoneInfo("America/New_York")
MARKET_OPEN_TIME = time(hour=9, minute=30)
MARKET_CLOSE_TIME = time(hour=16, minute=0)


def _next_trading_day(day):
    next_day = day + timedelta(days=1)
    while next_day.weekday() >= 5:  # Skip Saturday/Sunday
        next_day += timedelta(days=1)
    return next_day


def _format_market_event(ts: datetime, current: datetime) -> str:
    time_part = ts.strftime("%I:%M %p").lstrip("0")
    if ts.date() == current.date():
        return f"{time_part} ET"
    return f"{ts.strftime('%a')} {time_part} ET"


def compute_us_market_status(now: datetime | None = None) -> Dict[str, Any]:
    current = now.astimezone(MARKET_TZ) if now else datetime.now(MARKET_TZ)
    open_today = datetime.combine(current.date(), MARKET_OPEN_TIME, tzinfo=MARKET_TZ)
    close_today = datetime.combine(current.date(), MARKET_CLOSE_TIME, tzinfo=MARKET_TZ)
    trading_day = current.weekday() < 5

    if trading_day and open_today <= current < close_today:
        is_open = True
        next_event = close_today
        next_label = "Closes"
    elif trading_day and current < open_today:
        is_open = False
        next_event = open_today
        next_label = "Opens"
    else:
        is_open = False
        next_day = _next_trading_day(current.date())
        next_event = datetime.combine(next_day, MARKET_OPEN_TIME, tzinfo=MARKET_TZ)
        next_label = "Opens"

    descriptor = f"{next_label} {_format_market_event(next_event, current)}"
    return {
        "is_open": is_open,
        "state_text": "Open" if is_open else "Closed",
        "descriptor": descriptor,
        "indicator_class": "is-open" if is_open else "is-closed",
    }


@web_bp.app_context_processor
def inject_market_status():
    return {"market_status": compute_us_market_status()}

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

def get_primary_social_user() -> str:
    cfg = (current_app.config.get("SOCIAL_TWITTER_PRIMARY_USER") or "").strip().lstrip("@")
    if cfg:
        return cfg
    hs = get_social_handles()
    return hs[0] if hs else ""

@web_bp.route("/")
def index():
    categories = repo().list_categories()
    social_handles = get_social_handles()
    primary_handle = get_primary_social_user()
    return render_template(
        "index.html",
        categories=categories,
        social_handles=social_handles,
        primary_handle=primary_handle,
    )


@web_bp.route("/news")
def news_list():
    r = repo()
    categories = [cat for cat in r.list_categories() if cat.lower() != "oil"]
    theme_specs = [
        {
            "name": cat,
            "description": THEME_DESCRIPTIONS.get(cat.lower(), "Focused view"),
        }
        for cat in categories
        if cat != "System"
    ]

    active_tag = request.args.get("tag")
    q = request.args.get("q", "").strip()
    selected_industries = request.args.getlist("industries")
    selected_tags = request.args.getlist("tags")
    tag_mode = request.args.get("tag_mode", "any") or "any"
    preset_id = (request.args.get("preset") or "").strip()

    preset_def = NEWS_FILTER_PRESET_INDEX.get(preset_id)
    if preset_def:
        selected_industries = list(preset_def.get("industries") or [])
        selected_tags = list(preset_def.get("tags") or [])
        tag_mode = preset_def.get("tag_mode", tag_mode)

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

    def collect_tag_stats(items: Iterable[Dict[str, Any]]) -> tuple[Counter[str], Dict[str, str], Counter[str], Counter[str]]:
        counter: Counter[str] = Counter()
        display: Dict[str, str] = {}
        sentiment_sum: Counter[str] = Counter()
        sentiment_hits: Counter[str] = Counter()
        for item in items:
            sentiment = item.get("sentiment") or {}
            score = sentiment.get("score")
            for tag in item.get("tags") or []:
                if not tag:
                    continue
                slug = str(tag).lower().lstrip("#$")
                if not slug:
                    continue
                counter[slug] += 1
                display.setdefault(slug, str(tag).lstrip("#$"))
                if isinstance(score, (int, float)):
                    sentiment_sum[slug] += float(score)
                    sentiment_hits[slug] += 1
        return counter, display, sentiment_sum, sentiment_hits

    def collect_tag_counts(items: Iterable[Dict[str, Any]]) -> Counter[str]:
        counter: Counter[str] = Counter()
        for item in items:
            for tag in item.get("tags") or []:
                slug = str(tag).lower().lstrip("#$")
                if not slug:
                    continue
                counter[slug] += 1
        return counter

    def summarise_sentiment(score: float) -> tuple[str, str, str]:
        if score >= 1.0:
            return "Bullish skew", "success", "↑"
        if score <= -1.0:
            return "Bearish skew", "danger", "↓"
        if score >= 0.35:
            return "Positive tilt", "info", "↗"
        if score <= -0.35:
            return "Negative tilt", "warning", "↘"
        return "Neutral balance", "secondary", "•"

    def momentum_descriptor(delta: int) -> tuple[str, str]:
        if delta > 1:
            return "Heating up", "success"
        if delta == 1:
            return "Firming", "info"
        if delta == 0:
            return "Holding steady", "secondary"
        if delta == -1:
            return "Cooling", "warning"
        return "Fading", "danger"

    current_counts, tag_display, tag_sent_sum, tag_sent_hits = collect_tag_stats(enriched_items)
    baseline_counts = collect_tag_counts(baseline_pool)

    total_items = len(enriched_items) or 1
    hot_tags: List[Dict[str, Any]] = []
    for slug, count in current_counts.most_common(6):
        baseline_count = baseline_counts.get(slug, 0)
        delta = count - baseline_count
        share = count / total_items
        sentiment_avg = 0.0
        if tag_sent_hits.get(slug):
            sentiment_avg = tag_sent_sum[slug] / tag_sent_hits[slug]
        sentiment_label, sentiment_variant, sentiment_icon = summarise_sentiment(sentiment_avg)
        trend = "up" if delta > 0 else "down" if delta < 0 else "flat"
        hot_tags.append(
            {
                "label": tag_display.get(slug, slug),
                "href": build_news_url(q=f"#{tag_display.get(slug, slug)}"),
                "share_display": f"{share * 100:.1f}%",
                "delta_display": f"{delta:+d}",
                "trend": trend,
                "sentiment_label": sentiment_label,
                "sentiment_variant": sentiment_variant,
                "sentiment_icon": sentiment_icon,
                "sentiment_score": f"{sentiment_avg:+.1f}",
            }
        )

    narrative_clusters = cluster_articles_by_tag(enriched_items, limit=3)
    narratives: List[Dict[str, Any]] = []
    for cluster in narrative_clusters:
        articles = cluster.get("articles") or []
        if not articles:
            continue
        slug = cluster.get("slug") or str(cluster.get("tag", "")).lower()
        count = cluster.get("count", len(articles))
        baseline_count = baseline_counts.get(slug, 0)
        delta = count - baseline_count
        share = count / total_items
        sentiment_sum = 0.0
        sentiment_hits = 0
        bullish = 0
        bearish = 0
        for art in articles:
            sentiment = art.get("sentiment") or {}
            score = sentiment.get("score")
            if isinstance(score, (int, float)):
                score_val = float(score)
                sentiment_sum += score_val
                sentiment_hits += 1
                if score_val >= 1:
                    bullish += 1
                elif score_val <= -1:
                    bearish += 1
        avg_score = sentiment_sum / sentiment_hits if sentiment_hits else 0.0
        sentiment_label, sentiment_variant, sentiment_icon = summarise_sentiment(avg_score)
        momentum_label, momentum_variant = momentum_descriptor(delta)
        trend = "up" if delta > 0 else "down" if delta < 0 else "flat"
        primary = articles[0]
        related = articles[1:4]
        cluster_href = build_news_url(q=f"#{cluster['tag']}")
        headline_trend = (
            "surges" if delta > 1 else "firms" if delta == 1 else "holds steady" if delta == 0 else "cools"
        )
        narrative_headline = f"{cluster['tag']} narrative {headline_trend}"
        narratives.append(
            {
                "tag": cluster["tag"],
                "headline": narrative_headline,
                "count": count,
                "share_display": f"{share * 100:.1f}%",
                "delta_display": f"{delta:+d}",
                "trend": trend,
                "momentum_label": momentum_label,
                "momentum_variant": momentum_variant,
                "sentiment_label": sentiment_label,
                "sentiment_variant": sentiment_variant,
                "sentiment_icon": sentiment_icon,
                "sentiment_score": f"{avg_score:+.1f}",
                "bullish": bullish,
                "bearish": bearish,
                "lead": {
                    "title": primary.get("title"),
                    "summary": primary.get("summary"),
                    "url": primary.get("url"),
                },
                "related": [
                    {
                        "title": rel.get("title"),
                        "href": rel.get("url") or cluster_href,
                    }
                    for rel in related
                ],
                "href": cluster_href,
            }
        )

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
    for preset in NEWS_FILTER_PRESETS:
        href = build_news_url(
            preset=preset["id"],
            industries=preset.get("industries") or None,
            tags=preset.get("tags") or None,
            tag_mode=preset.get("tag_mode"),
        )

        preset_links.append(
            {
                "id": preset["id"],
                "label": preset["label"],
                "description": preset.get("description", ""),
                "href": href,
                "active": preset["id"] == preset_id,
            }
        )

    active_preset = next((p for p in preset_links if p["active"]), None)

    theme_cards: List[Dict[str, Any]] = [
        {
            "name": "All",
            "description": "Full blended feed",
            "href": build_news_url(tag=None),
            "active": not bool(active_tag),
        }
    ]
    for spec in theme_specs:
        if spec["name"] == "System":
            continue
        theme_cards.append(
            {
                "name": spec["name"],
                "description": spec.get("description", "Focused view"),
                "href": build_news_url(tag=spec["name"]),
                "active": active_tag == spec["name"],
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
        hot_tags=hot_tags,
        narratives=narratives,
        quick_tags=quick_tags,
        filter_presets=preset_links,
        active_preset=active_preset,
        news_refreshed=refreshed_display,
        theme_cards=theme_cards,
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
    primary_handle = get_primary_social_user()
    return render_template("social.html", handles=handles, primary_handle=primary_handle)


@web_bp.route("/contact")
def contact():
    return render_template("contact.html")


@web_bp.route("/mission")
def mission():
    return render_template("mission.html")


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
