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

BASE_DIR = Path(__file__).resolve().parent

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
    symbols_raw = cfg.get("SOCIAL_SCRAPE_SYMBOLS", "")
    symbols = [s.strip() for s in symbols_raw.split(",") if s.strip()]
    if not symbols:
        click.echo("No symbols configured. Set SOCIAL_SCRAPE_SYMBOLS in .env")
        return

    payload = ingest_social(
        cfg["SOCIAL_DATA_PATH"],
        symbols,
        max_posts=cfg.get("SOCIAL_SCRAPE_MAX_POSTS", 50),
        lookback_hours=cfg.get("SOCIAL_SCRAPE_LOOKBACK_HOURS", 12),
        twitter_bearer_token=cfg.get("SOCIAL_TWITTER_BEARER_TOKEN"),
    )
    click.echo(f"Scraped social data for {len(payload['symbols'])} symbols")


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
            from services.social_ingest import scrape_x_symbol

            posts = scrape_x_symbol(
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

# 2) App factory that registers the command
def create_app(test_config: dict | None = None) -> Flask:
    load_dotenv()  # loads .env from project root

    app = Flask(__name__, instance_relative_config=False)
    app.config.from_mapping({
        "DATA_PATH": str(BASE_DIR / "data" / "news.json"),
        "SOCIAL_DATA_PATH": str(BASE_DIR / "data" / "social.json"),
        # Comma-separated Twitter handles to embed (e.g. "WSJMarkets,CNBC,TheTerminal")
        "SOCIAL_TWITTER_ACCOUNTS": os.getenv("SOCIAL_TWITTER_ACCOUNTS", ""),
        # Optional: user to scrape tweets from (without @). If empty, defaults to first SOCIAL_TWITTER_ACCOUNTS.
        "SOCIAL_TWITTER_SCRAPE_USER": os.getenv("SOCIAL_TWITTER_SCRAPE_USER", ""),
        # Cache duration for scraped tweets (minutes)
        "SOCIAL_TWITTER_SCRAPE_CACHE_MINUTES": int(os.getenv("SOCIAL_TWITTER_SCRAPE_CACHE_MINUTES", "10")),
        # Social ingest defaults
        "SOCIAL_SCRAPE_SYMBOLS": os.getenv("SOCIAL_SCRAPE_SYMBOLS", "SPY,QQQ,IWM"),
        "SOCIAL_SCRAPE_MAX_POSTS": int(os.getenv("SOCIAL_SCRAPE_MAX_POSTS", "40")),
        "SOCIAL_SCRAPE_LOOKBACK_HOURS": int(os.getenv("SOCIAL_SCRAPE_LOOKBACK_HOURS", "12")),
        "SOCIAL_TWITTER_BEARER_TOKEN": os.getenv("SOCIAL_TWITTER_BEARER_TOKEN", ""),
        "FRED_API_KEY": os.getenv("FRED_API_KEY", ""),
        "EIA_API_KEY": os.getenv("EIA_API_KEY", ""),
    })
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

    return app

# 3) Normal run entrypoint
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
