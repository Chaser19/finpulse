# made possible with ChatGpt

from __future__ import annotations
from pathlib import Path
from datetime import datetime, timedelta
import json
import random
from flask import Flask, current_app
from flask.cli import with_appcontext
from dotenv import load_dotenv

import os
print("[env] FMP_KEY set:", bool(os.getenv("FMP_KEY")))
print("[env] ALPHAVANTAGE_KEY set:", bool(os.getenv("ALPHAVANTAGE_KEY")))
print("[env] ALPHAVANTAGE_KEY set:", bool(os.getenv("ALPHAVANTAGE_KEY")))

import click

from services.twitter_auth import normalize_bearer_token

BASE_DIR = Path(__file__).resolve().parent


def _env_flag(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


# 1) Define the CLI command first
@click.command("ingest-news")
@with_appcontext
def ingest_news_cmd():
    """Fetch from providers and merge into data/news.json."""
    from services.ingest import ingest_all
    n = ingest_all(current_app.config["DATA_PATH"])
    click.echo(f"Ingested. Total items now: {n}")


@click.command("ingest-social")
@with_appcontext
def ingest_social_cmd():
    """Fetch social sentiment data via the Twitter API and persist to JSON."""
    from services.social_ingest import ingest_social

    cfg = current_app.config
    symbols_raw = cfg.get("SOCIAL_TWITTER_SYMBOLS", "")
    symbols = [s.strip() for s in symbols_raw.split(",") if s.strip()]
    if not symbols:
        click.echo("No symbols configured. Set SOCIAL_TWITTER_SYMBOLS in .env")
        return

    payload = ingest_social(
        cfg["SOCIAL_DATA_PATH"],
        symbols,
        max_posts=cfg.get("SOCIAL_TWITTER_MAX_POSTS", 50),
        lookback_hours=cfg.get("SOCIAL_TWITTER_LOOKBACK_HOURS", 12),
        twitter_bearer_token=cfg.get("SOCIAL_TWITTER_BEARER_TOKEN"),
    )
    click.echo(f"Fetched social data for {len(payload['symbols'])} symbols via the Twitter API")


@click.command("diag-social")
@click.option("--symbol", "symbol", default="SPY", help="Symbol to test, e.g. SPY")
@with_appcontext
def diag_social_cmd(symbol: str):
    """Diagnose Twitter social ingestion (requires bearer token)."""
    cfg = current_app.config
    token = cfg.get("SOCIAL_TWITTER_BEARER_TOKEN")

    if token:
        click.echo("Twitter API bearer token detected; testing official endpoint")
        try:
            from services.social_ingest import fetch_x_symbol_posts

            posts = fetch_x_symbol_posts(
                symbol.strip().lstrip("$").upper(),
                limit=5,
                lookback_hours=12,
                bearer_token=token,
            )
            click.echo(f"Fetched {len(posts)} posts for ${symbol} via Twitter API")
            for p in posts[:5]:
                snippet = p.text[:100].replace("\n", " ")
                click.echo(f"- {p.created_at} @{p.author}: {snippet}")
        except Exception as exc:
            click.echo(f"Twitter API query failed: {exc}")
        return

    click.echo("No Twitter API token configured; cannot run diagnostics")


@click.command("seed-social-history")
@click.option("--points", default=24, show_default=True, help="Number of synthetic history points to generate")
@with_appcontext
def seed_social_history_cmd(points: int):
    """Populate data/social.json with synthetic history for demo/sample mode."""
    from services.social_ingest import MAX_HISTORY_POINTS

    cfg = current_app.config
    social_path = Path(cfg["SOCIAL_DATA_PATH"])
    if not social_path.exists():
        click.echo("data/social.json not found. Run flask ingest-social first.")
        return

    try:
        payload = json.loads(social_path.read_text(encoding="utf-8"))
    except Exception as exc:
        click.echo(f"Failed to read social data: {exc}")
        return

    symbols = payload.get("symbols")
    if not symbols:
        click.echo("No symbols found in social data. Run ingest-social first.")
        return

    history_map = payload.get("history") or {}
    rng = random.Random()
    now = datetime.utcnow()

    for sym, info in symbols.items():
        summary = info.get("summary") or {}
        price = info.get("price") or {}

        base_net = float(summary.get("net_score") or 0)
        base_posts = int(summary.get("posts") or 30)
        base_bull = float(summary.get("bullish_score") or 0)
        base_bear = float(summary.get("bearish_score") or 0)
        base_close = float(price.get("close") or 20.0)
        base_change = float(price.get("change_pct") or 0.0)
        base_abs = float(price.get("change_abs") or 0.0)
        base_vol = float(price.get("volume") or 1_000_000.0)

        entries = []
        for idx in range(max(2, points)):
            ts = now - timedelta(hours=(points - idx))
            net = max(-300, min(300, base_net + rng.uniform(-20, 20)))
            posts = max(5, int(base_posts + rng.randint(-6, 6)))
            bull_score = max(0.0, base_bull + rng.uniform(-15, 15))
            bear_score = max(0.0, base_bear + rng.uniform(-15, 15))
            change_pct = base_change + rng.uniform(-3, 3)
            change_abs = base_abs + rng.uniform(-1, 1)
            close = max(0.5, base_close + rng.uniform(-2, 2))
            volume = max(0.0, base_vol * rng.uniform(0.7, 1.3))

            entries.append(
                {
                    "timestamp": ts.isoformat(),
                    "net_score": round(net, 2),
                    "bullish_score": round(bull_score, 2),
                    "bearish_score": round(bear_score, 2),
                    "posts": posts,
                    "change_pct": round(change_pct, 2),
                    "close": round(close, 2),
                    "volume": round(volume, 2),
                }
            )

        entries = entries[-MAX_HISTORY_POINTS:]
        info["history"] = entries
        history_map[sym] = entries

    payload["history"] = history_map

    try:
        social_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as exc:
        click.echo(f"Failed to write social data: {exc}")
        return

    click.echo(f"Seeded synthetic history with {points} points per symbol.")


@click.command("refresh-macro")
@click.option("--dump", is_flag=True, help="Print the refreshed payload JSON")
@with_appcontext
def refresh_macro_cmd(dump: bool) -> None:
    """Force-refresh the macro trends cache."""
    from services.macro_trends import get_macro_trends

    cfg = current_app.config
    payload = get_macro_trends(
        fred_api_key=cfg.get("FRED_API_KEY", ""),
        eia_api_key=cfg.get("EIA_API_KEY", ""),
        force_refresh=True,
    )

    categories = payload.get("categories") or []
    category_count = len(categories)
    metric_count = sum(len((cat or {}).get("metrics") or []) for cat in categories)
    click.echo(f"Refreshed macro cache with {metric_count} metrics across {category_count} categories.")

    updated = payload.get("updated")
    if updated:
        click.echo(f"Updated timestamp: {updated}")

    if dump:
        click.echo(json.dumps(payload, indent=2, sort_keys=True))

# 2) App factory that registers the command
def create_app(test_config: dict | None = None) -> Flask:
    # Attempt to load environment variables. Fall back to .env.gitignore when .env is absent
    # so local sample keys are picked up during development.
    if not load_dotenv():  # loads .env from project root
        load_dotenv(".env.gitignore")

    app = Flask(__name__, instance_relative_config=False)

    twitter_symbols = os.getenv("SOCIAL_TWITTER_SYMBOLS") or os.getenv("SOCIAL_SCRAPE_SYMBOLS", "SPY,QQQ,IWM")
    twitter_max_posts = int(os.getenv("SOCIAL_TWITTER_MAX_POSTS") or os.getenv("SOCIAL_SCRAPE_MAX_POSTS", "40"))
    twitter_lookback = int(os.getenv("SOCIAL_TWITTER_LOOKBACK_HOURS") or os.getenv("SOCIAL_SCRAPE_LOOKBACK_HOURS", "12"))
    twitter_primary_user = os.getenv("SOCIAL_TWITTER_PRIMARY_USER") or os.getenv("SOCIAL_TWITTER_SCRAPE_USER", "")
    twitter_timeline_cache = int(
        os.getenv("SOCIAL_TWITTER_TIMELINE_CACHE_MINUTES")
        or os.getenv("SOCIAL_TWITTER_SCRAPE_CACHE_MINUTES", "10")
    )
    twitter_bearer_token = normalize_bearer_token(
        os.getenv("SOCIAL_TWITTER_BEARER_TOKEN") or os.getenv("TWITTER_BEARER_TOKEN")
    )
    news_refresh_interval = int(os.getenv("NEWS_REFRESH_INTERVAL_SECONDS", str(2 * 60 * 60)))

    app.config.from_mapping({
        "DATA_PATH": str(BASE_DIR / "data" / "news.json"),
        "SOCIAL_DATA_PATH": str(BASE_DIR / "data" / "social.json"),
        # Comma-separated Twitter handles to embed (e.g. "WSJMarkets,CNBC,TheTerminal")
        "SOCIAL_TWITTER_ACCOUNTS": os.getenv("SOCIAL_TWITTER_ACCOUNTS", ""),
        # Preferred account to showcase in the UI / API when multiple handles exist (without @)
        "SOCIAL_TWITTER_PRIMARY_USER": twitter_primary_user,
        # Cache duration for API timeline fetches (minutes)
        "SOCIAL_TWITTER_TIMELINE_CACHE_MINUTES": twitter_timeline_cache,
        # Social ingest defaults (Twitter API powered)
        "SOCIAL_TWITTER_SYMBOLS": twitter_symbols,
        "SOCIAL_TWITTER_MAX_POSTS": twitter_max_posts,
        "SOCIAL_TWITTER_LOOKBACK_HOURS": twitter_lookback,
        "SOCIAL_TWITTER_BEARER_TOKEN": twitter_bearer_token or "",
        "SOCIAL_FINNHUB_MAX_SYMBOLS": int(os.getenv("SOCIAL_FINNHUB_MAX_SYMBOLS", "25")),
        "SOCIAL_FINNHUB_RESOLUTION": os.getenv("SOCIAL_FINNHUB_RESOLUTION", "30"),
        "SOCIAL_FINNHUB_LOOKBACK_HOURS": int(os.getenv("SOCIAL_FINNHUB_LOOKBACK_HOURS", "24")),
        "FRED_API_KEY": os.getenv("FRED_API_KEY", ""),
        "EIA_API_KEY": os.getenv("EIA_API_KEY", ""),
        "NEWS_REFRESH_INTERVAL_SECONDS": news_refresh_interval,
        "NEWS_AUTO_INCLUDE_ALPHA_VANTAGE": _env_flag("NEWS_AUTO_INCLUDE_ALPHA_VANTAGE", True),
        "NEWS_AUTO_INCLUDE_NEWSAPI": _env_flag("NEWS_AUTO_INCLUDE_NEWSAPI", True),
    })

    # Provide backward-compatible aliases for legacy config names until they are removed.
    app.config.setdefault("SOCIAL_TWITTER_SCRAPE_USER", twitter_primary_user)
    app.config.setdefault("SOCIAL_TWITTER_SCRAPE_CACHE_MINUTES", twitter_timeline_cache)
    app.config.setdefault("SOCIAL_SCRAPE_SYMBOLS", twitter_symbols)
    app.config.setdefault("SOCIAL_SCRAPE_MAX_POSTS", twitter_max_posts)
    app.config.setdefault("SOCIAL_SCRAPE_LOOKBACK_HOURS", twitter_lookback)
    if test_config:
        app.config.update(test_config)

    # Blueprints
    from blueprints.web import web_bp
    from blueprints.api import api_bp
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    # Register CLI command here (on THIS app instance)
    app.cli.add_command(ingest_news_cmd, name="ingest-news")
    app.cli.add_command(ingest_social_cmd, name="ingest-social")
    app.cli.add_command(diag_social_cmd, name="diag-social")
    app.cli.add_command(seed_social_history_cmd, name="seed-social-history")
    app.cli.add_command(refresh_macro_cmd, name="refresh-macro")

    # Auto-ingest news on an interval so the dashboard stays fresh.
    try:
        from services.news_cache import init_news_cache

        init_news_cache(app, interval_seconds=app.config.get("NEWS_REFRESH_INTERVAL_SECONDS"))
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.warning("Unable to start news auto-ingest: %s", exc)

    # Warm macro trends cache so the dashboard loads instantly.
    try:
        from services.macro_trends import init_macro_trends_cache

        init_macro_trends_cache(app)
    except Exception as exc:  # pragma: no cover - defensive
        app.logger.warning("Unable to initialise macro cache: %s", exc)

    return app

# 3) Normal run entrypoint
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
