from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Any, Dict
from zoneinfo import ZoneInfo

from flask import Blueprint, redirect, render_template, url_for

web_bp = Blueprint("web", __name__)

MARKET_TZ = ZoneInfo("America/New_York")
MARKET_OPEN_TIME = time(hour=9, minute=30)
MARKET_CLOSE_TIME = time(hour=16, minute=0)


def _next_trading_day(day):
    next_day = day + timedelta(days=1)
    while next_day.weekday() >= 5:
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


@web_bp.route("/")
def index():
    return redirect(url_for("web.mission"))


@web_bp.route("/home")
def home():
    return render_template("index.html")


@web_bp.route("/contact")
def contact():
    return render_template("contact.html")


@web_bp.route("/mission")
def mission():
    return render_template("mission.html")
