from __future__ import annotations
from datetime import datetime

from flask import Blueprint, current_app, render_template, request, redirect, url_for
from services.news_repo import NewsRepo
from urllib.parse import urlencode
from services.macro_trends import get_macro_trends

web_bp = Blueprint("web", __name__)


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

    items = r.query_curated(
        industries=combined_industries or None,
        tags=selected_tags or None,
        tag_mode=tag_mode,
        q=q or None,
    )

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

    return render_template(
        "news.html",
        items=items,
        active_tag=active_tag,
        q=q,
        categories=categories,
        selected_industries=combined_industries,
        selected_tags=selected_tags,
        tag_mode=tag_mode,
        top_tags=top_tags,
        build_news_url=build_news_url,
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
