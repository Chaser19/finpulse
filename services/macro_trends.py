"""Utility helpers to compile macro trend bullets for the homepage."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, Optional

import logging
import requests


log = logging.getLogger(__name__)


FALLBACK_BUCKETS: Dict[str, Iterable[str]] = {
    "inflation": (
        "Headline CPI cooled to 2.9% YoY while services inflation remains sticky.",
        "Fed funds futures imply two 25bp cuts by year-end; policymakers stay data-dependent.",
    ),
    "growth": (
        "US ISM Manufacturing ticked back above 50 signalling tentative expansion.",
        "Global PMIs mixed: eurozone stabilising while China demand remains soft.",
    ),
    "commodities": (
        "Brent crude holds near $85 as OPEC+ keeps voluntary cuts in place.",
        "Gold trades above $2,100 on safe-haven flows and a softer dollar tone.",
    ),
    "geopolitics": (
        "Middle East tensions sustain elevated shipping costs; Red Sea detours persist.",
        "US election rhetoric ramps up, adding policy uncertainty to fiscal outlook.",
    ),
}


@dataclass(slots=True)
class MacroTrendsService:
    """Fetches macro datapoints from external APIs and transforms them into short bullets."""

    fred_api_key: str = ""
    eia_api_key: str = ""
    session: requests.Session | None = None

    def __post_init__(self) -> None:
        if self.session is None:
            self.session = requests.Session()

    # ---- External data helpers -------------------------------------------------

    def _fred_latest(self, series_id: str) -> Optional[Dict[str, Any]]:
        if not self.fred_api_key:
            return None
        params = {
            "series_id": series_id,
            "api_key": self.fred_api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": 2,
        }
        try:
            resp = self.session.get(
                "https://api.stlouisfed.org/fred/series/observations", params=params, timeout=6
            )
            resp.raise_for_status()
            data = resp.json()
            observations = data.get("observations", [])
            return observations[0] if observations else None
        except Exception as exc:
            log.warning("FRED request failed for %s: %s", series_id, exc)
            return None

    def _eia_series(self, series_id: str) -> Optional[Dict[str, Any]]:
        if not self.eia_api_key:
            return None
        params = {"api_key": self.eia_api_key, "series_id": series_id}
        try:
            resp = self.session.get("https://api.eia.gov/series/", params=params, timeout=6)
            resp.raise_for_status()
            data = resp.json()
            series = data.get("series", [])
            return series[0] if series else None
        except Exception as exc:
            log.warning("EIA request failed for %s: %s", series_id, exc)
            return None

    def _gdelt_summary(self) -> Optional[Dict[str, Any]]:
        try:
            resp = self.session.get(
                "https://api.gdeltproject.org/api/v2/summary/summary",
                params={"format": "json"},
                timeout=6,
            )
            resp.raise_for_status()
            return resp.json().get("summary")
        except Exception as exc:
            log.info("GDELT summary fetch failed (using fallback geopolitics bullet): %s", exc)
            return None

    # ---- Bullet generators -----------------------------------------------------

    def _build_inflation_bullets(self) -> Iterable[str]:
        observation = self._fred_latest("CPIAUCSL")
        core = self._fred_latest("CPILFESL")
        fedfunds = self._fred_latest("FEDFUNDS")
        if not observation:
            return FALLBACK_BUCKETS["inflation"]

        def fmt(obs: Dict[str, Any]) -> str:
            value = obs.get("value")
            date = obs.get("date")
            try:
                value = float(value)
            except (TypeError, ValueError):
                value = value
            return date, value

        cpi_date, cpi_value = fmt(observation)
        bullets = [
            f"Headline CPI ({cpi_date}) printed at {cpi_value}% YoY." if isinstance(cpi_value, (int, float)) else f"Headline CPI latest value: {cpi_value}.",
        ]
        if core:
            core_date, core_value = fmt(core)
            bullets.append(
                f"Core CPI ({core_date}) at {core_value}% keeps services inflation elevated."
                if isinstance(core_value, (int, float))
                else f"Core CPI latest value: {core_value}."
            )
        if fedfunds:
            _, ff_value = fmt(fedfunds)
            if isinstance(ff_value, (int, float)):
                bullets.append(f"Effective fed funds rate stands near {ff_value:.2f}%.")
        if len(bullets) < 2:
            bullets.extend(FALLBACK_BUCKETS["inflation"])  # ensure at least two items
        return bullets[:2]

    def _build_growth_bullets(self) -> Iterable[str]:
        ism = self._fred_latest("NAPM")
        gdpnow = self._fred_latest("GDPC1")
        bullets = []
        if ism and isinstance(ism.get("value"), str):
            try:
                ism_val = float(ism["value"])
                bullets.append(
                    f"ISM manufacturing index ({ism['date']}) printed at {ism_val:.1f}, "
                    + ("suggesting expansion." if ism_val >= 50 else "signalling contraction.")
                )
            except ValueError:
                pass
        if gdpnow and isinstance(gdpnow.get("value"), str):
            try:
                gdp_val = float(gdpnow["value"])
                bullets.append(f"Real GDP ({gdpnow['date']}) now tracking at {gdp_val:.2f} (SAAR).")
            except ValueError:
                pass
        if not bullets:
            bullets = list(FALLBACK_BUCKETS["growth"])
        return bullets[:2]

    def _build_commodities_bullets(self) -> Iterable[str]:
        wti = self._eia_series("PET.RWTC.D")
        storage = self._eia_series("PET.WCESTUS1.W")
        bullets = []
        if wti and wti.get("data"):
            latest = wti["data"][0]
            try:
                price = float(latest[1])
                bullets.append(f"WTI crude trades around ${price:.2f} per barrel (latest {latest[0]}).")
            except (ValueError, TypeError):
                pass
        if storage and storage.get("data"):
            latest = storage["data"][0]
            try:
                barrels = float(latest[1])
                bullets.append(f"US crude inventories near {barrels/1_000:.1f} million barrels (EIA).")
            except (ValueError, TypeError):
                pass
        if not bullets:
            bullets = list(FALLBACK_BUCKETS["commodities"])
        return bullets[:2]

    def _build_geopolitics_bullets(self) -> Iterable[str]:
        summary = self._gdelt_summary()
        if not summary:
            return FALLBACK_BUCKETS["geopolitics"]
        highlights = summary.get("toplines") or []
        bullets = [line.get("text") for line in highlights if isinstance(line.get("text"), str)]
        bullets = [b for b in bullets if b]
        if not bullets:
            return FALLBACK_BUCKETS["geopolitics"]
        return bullets[:2]

    # ---- public API -------------------------------------------------------------

    def fetch(self) -> Dict[str, Any]:
        return {
            "updated": datetime.utcnow().isoformat(),
            "buckets": {
                "inflation": list(self._build_inflation_bullets()),
                "growth": list(self._build_growth_bullets()),
                "commodities": list(self._build_commodities_bullets()),
                "geopolitics": list(self._build_geopolitics_bullets()),
            },
        }


def get_macro_trends(fred_api_key: str = "", eia_api_key: str = "") -> Dict[str, Any]:
    """Convenience wrapper used by the Flask blueprint."""

    service = MacroTrendsService(
        fred_api_key=fred_api_key or "",
        eia_api_key=eia_api_key or "",
    )
    return service.fetch()
