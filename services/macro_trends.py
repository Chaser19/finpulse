"""Utility helpers to compile macro trend bullets for the homepage."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import copy
import logging
import time
from threading import Event, Lock, Thread

import requests


log = logging.getLogger(__name__)


_CACHE_LOCK = Lock()
_CACHE_DATA: Dict[str, Any] | None = None
_CACHE_TIMESTAMP: float = 0.0
_CACHE_TTL_SECONDS = 2 * 60 * 60  # 2 hours default
_CACHE_THREAD_STARTED = False
_CACHE_STOP_EVENT: Event | None = None


FALLBACK_CATEGORIES: List[Dict[str, Any]] = [
    {
        "id": "job-market",
        "title": "Job Market",
        "metrics": [
            {
                "id": "unemployment-rate",
                "name": "Unemployment rate",
                "summary": "3.8%",
                "detail": "Unemployment remains historically low with only a marginal uptick versus the prior month.",
                "delta": "Change vs prior month: +0.1pp",
                "insights": {
                    "overview": "Share of the labour force that is jobless but actively seeking work. A lower rate signals a tighter labour market.",
                    "high": "Above roughly 6% typically reflects slack demand for labour and rising recession risk as layoffs broaden.",
                    "low": "Below about 4% indicates a very tight market where employers may struggle to hire, often pressuring wages higher.",
                    "range": "Post-2000 range has spanned ~3.5% at the trough to ~10% during recessions.",
                },
            },
            {
                "id": "initial-jobless-claims",
                "name": "Initial jobless claims",
                "summary": "~230k weekly",
                "detail": "Initial claims continue to hover near cycle lows, underscoring a resilient labour market.",
                "insights": {
                    "overview": "Weekly number of people filing for unemployment insurance for the first time—a timely layoff proxy.",
                    "high": "Sustained readings above ~300k suggest layoffs are accelerating and labour demand is cooling quickly.",
                    "low": "Prints nearer 200k or below imply employers are holding on to workers and demand remains firm.",
                    "range": "Since 2000 the series has oscillated between ~170k (tight) and above 650k (severe downturn).",
                },
            },
            {
                "id": "nonfarm-payrolls",
                "name": "Nonfarm payrolls",
                "summary": "+187k",
                "detail": "Payroll growth cooled from the prior month but still exceeds the pre-pandemic trendline.",
                "insights": {
                    "overview": "Monthly change in the number of employees on business payrolls, excluding farm workers.",
                    "high": "Gains north of ~250k indicate robust hiring momentum and strengthening growth.",
                    "low": "Flat or negative prints point to hiring freezes or layoffs, often preceding economic slowdowns.",
                    "range": "Typical expansion pace is +150k to +200k per month; severe recessions can see -700k or worse.",
                },
            },
        ],
    },
    {
        "id": "inflation",
        "title": "Inflation",
        "metrics": [
            {
                "id": "cpi-yoy",
                "name": "CPI (YoY)",
                "summary": "3.2%",
                "detail": "Headline CPI edged higher on energy while core services inflation stays sticky.",
                "insights": {
                    "overview": "Annual percentage change in the consumer price index covering a broad basket of goods and services.",
                    "high": "Readings above ~4% signal elevated inflation that can erode purchasing power and prompt tighter policy.",
                    "low": "Rates near 2% are consistent with the Fed's long-run goal; below 1% can point to disinflationary pressure.",
                    "range": "In the last two decades CPI YoY has ranged from ~-2% (deflation scare) to over 9% (2022 energy shock).",
                },
            },
            {
                "id": "core-cpi-yoy",
                "name": "Core CPI (YoY)",
                "summary": "4.1%",
                "detail": "Core CPI eased modestly thanks to softer shelter and used car prices.",
                "insights": {
                    "overview": "Headline CPI excluding food and energy—favoured for gauging underlying inflation trends.",
                    "high": "Above ~4% suggests broad-based price pressures that are harder to tame without policy tightening.",
                    "low": "Close to 2% aligns with stable inflation; below 1.5% may hint that demand is softening materially.",
                    "range": "Core CPI has mostly stayed between 1% and 6% since 2000, rarely spiking into double digits.",
                },
            },
            {
                "id": "ppi-mom",
                "name": "PPI (MoM)",
                "summary": "+0.2%",
                "detail": "Producer prices climbed on higher goods costs while services categories softened.",
                "insights": {
                    "overview": "Monthly change in producer prices received by domestic firms—often feeds into consumer inflation with a lag.",
                    "high": "Moves of +0.5% or higher can foreshadow pipeline cost pressure and future CPI acceleration.",
                    "low": "Flat or negative prints imply easing cost pressure; persistent declines may flag demand weakness.",
                    "range": "Typical month-to-month swings land between -0.5% and +0.8%, though energy shocks can push beyond.",
                },
            },
        ],
    },
    {
        "id": "economic-activities",
        "title": "Economic Activities",
        "metrics": [
            {
                "id": "industrial-production",
                "name": "Industrial production index",
                "summary": "103.9",
                "detail": "Industrial production continues to edge higher thanks to firmer factory output and steady utilities demand.",
                "delta": "Change vs prior month: +0.2%",
                "insights": {
                    "overview": "Composite index of real output for manufacturing, mining, and utilities (2017 = 100).",
                    "high": "Levels above ~105 signal activity running meaningfully above the 2017 base-year average.",
                    "low": "Drops below ~95 often coincide with industrial slowdowns or recessionary conditions.",
                    "range": "Over the last decade the index has ranged roughly from 90 (pandemic trough) to 110 (late-cycle peaks).",
                },
            },
            {
                "id": "retail-sales",
                "name": "Retail sales (advance)",
                "summary": "$704B",
                "detail": "Consumer spending remains resilient with broad-based gains across goods and dining.",
                "delta": "Change vs prior month: +0.4%",
                "insights": {
                    "overview": "Early estimate of total monthly sales for retail and food services, a key barometer of consumer demand.",
                    "high": "Monthly growth north of 1% (after inflation) indicates a very strong consumer impulse.",
                    "low": "Consecutive declines or growth below 0% can warn that discretionary spending is rolling over.",
                    "range": "Nominal sales trend higher over time; monthly percentage changes typically sit between -2% and +2%.",
                },
            },
            {
                "id": "housing-starts",
                "name": "Housing starts",
                "summary": "1,360k",
                "detail": "Housing starts softened slightly as higher mortgage rates weigh on single-family demand.",
                "delta": "Change vs prior month: -30k",
                "insights": {
                    "overview": "Annualised number of new residential construction projects that broke ground during the month.",
                    "high": "Activity above ~1.5 million units signals healthy builder confidence and housing demand.",
                    "low": "Readings under ~1.1 million often coincide with housing recessions or tight financing conditions.",
                    "range": "Since 2000 starts have swung from ~500k at the crisis low to over 2 million during the housing boom.",
                },
            },
            {
                "id": "consumer-sentiment",
                "name": "Consumer sentiment (UMich)",
                "summary": "68.0",
                "detail": "Household sentiment stabilised as labour-market confidence offsets price concerns.",
                "delta": "Change vs prior month: +0.5",
                "insights": {
                    "overview": "University of Michigan survey index capturing households’ views on current conditions and expectations.",
                    "high": "Prints above ~90 reflect upbeat consumers and typically align with strong spending trends.",
                    "low": "Sub-70 readings suggest caution and often appear when inflation or employment worries intensify.",
                    "range": "Historically oscillates between the mid-50s (deep pessimism) and low-100s (strong optimism).",
                },
            },
        ],
    },
    {
        "id": "energy",
        "title": "Energy Markets",
        "metrics": [
            {
                "id": "wti-crude",
                "name": "WTI crude oil",
                "summary": "$84.00",
                "detail": "West Texas Intermediate spot prices remain range-bound amid global supply adjustments.",
                "delta": "Change vs prior day: +0.50",
                "insights": {
                    "overview": "Benchmark U.S. crude oil price traded in Cushing, Oklahoma—drives gasoline and input costs.",
                    "high": "Prices above ~$90/bbl can strain consumers and boost inflation, often reflecting supply tightness.",
                    "low": "Below ~$60/bbl typically eases fuel costs but may signal global growth worries or surplus supply.",
                    "range": "The past decade has seen swings from sub-$20 (2020 collapse) to above $120 during supply shocks.",
                },
            },
            {
                "id": "natural-gas",
                "name": "Henry Hub natural gas",
                "summary": "$2.50",
                "detail": "Benchmark U.S. natural gas prices hover near recent averages as storage stays ample.",
                "delta": "Change vs prior day: -0.05",
                "insights": {
                    "overview": "Spot price for natural gas at the Henry Hub in Louisiana, a key reference for U.S. gas markets.",
                    "high": "Above ~$5/MMBtu usually reflects tight supply or extreme weather demand spikes.",
                    "low": "Below ~$2/MMBtu suggests oversupply and can pressure producer profitability.",
                    "range": "Since 2010 Henry Hub prices have mostly ranged between $2 and $6, with brief spikes above $9.",
                },
            },
            {
                "id": "retail-gasoline",
                "name": "US regular gasoline",
                "summary": "$3.50",
                "detail": "Retail unleaded gasoline prices remain steady nationwide with regional variation.",
                "delta": "Change vs prior week: -0.02",
                "insights": {
                    "overview": "Average U.S. pump price for regular gasoline—closely watched by consumers and policymakers.",
                    "high": "Sustained moves above ~$3.75/gal often squeeze household budgets and can dampen discretionary spending.",
                    "low": "Below ~$2.75/gal eases pressure and acts like a tax cut for consumers.",
                    "range": "Past-decade prices have oscillated between roughly $1.75 and $4.25 per gallon.",
                },
            },
        ],
    },
]

FALLBACK_METRIC_INDEX = {
    category["id"]: {metric["id"]: metric for metric in category["metrics"]}
    for category in FALLBACK_CATEGORIES
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

    def _fred_observations(self, series_id: str, limit: int = 2) -> List[Dict[str, Any]]:
        if not self.fred_api_key:
            return []
        limit = max(1, min(limit, 100))
        params = {
            "series_id": series_id,
            "api_key": self.fred_api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": limit,
        }
        try:
            resp = self.session.get(
                "https://api.stlouisfed.org/fred/series/observations", params=params, timeout=6
            )
            resp.raise_for_status()
            data = resp.json()
            observations = data.get("observations", [])
            return observations
        except Exception as exc:
            log.warning("FRED request failed for %s: %s", series_id, exc)
            return []

    def _eia_series(self, series_id: str, limit: int = 3) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if not self.eia_api_key:
            return [], {}
        limit = max(1, min(limit, 100))
        try:
            url = f"https://api.eia.gov/v2/seriesid/{series_id}"
            params = {
                "api_key": self.eia_api_key,
                "sort[0][column]": "period",
                "sort[0][direction]": "desc",
                "length": limit,
                "offset": 0,
            }
            resp = self.session.get(url, params=params, timeout=4)
            resp.raise_for_status()
            payload = resp.json()
            response = payload.get("response") or {}
            raw_data = response.get("data") or []
            units: Optional[str] = None
            description: Optional[str] = None
            points: List[Dict[str, Any]] = []
            for entry in raw_data[:limit]:
                value = self._to_float(entry.get("value"))
                if value is None:
                    continue
                if units is None:
                    units = entry.get("units")
                if description is None:
                    description = entry.get("series-description")
                points.append({"date": str(entry.get("period", "")), "value": value})
            meta = {
                "frequency": response.get("frequency"),
                "units": units,
                "description": description,
            }
            return points, meta
        except Exception as exc:
            log.warning("EIA request failed for %s: %s", series_id, exc)
            return [], {}

    def _eia_history(self, series_id: str, points: int = 60) -> List[Dict[str, Any]]:
        rows, _ = self._eia_series(series_id, limit=max(points, 3))
        if not rows:
            return []
        sorted_rows = sorted(rows, key=lambda item: item.get("date", ""))
        trimmed = sorted_rows[-points:]
        history: List[Dict[str, Any]] = []
        for entry in trimmed:
            value = self._to_float(entry.get("value"))
            if value is None:
                continue
            history.append({"date": entry.get("date", ""), "value": round(value, 4)})
        return history

    # ---- Formatting helpers ----------------------------------------------------

    @staticmethod
    def _format_date(raw: Optional[str]) -> str:
        if not raw:
            return "latest"
        value = str(raw)
        patterns = (
            ("%Y-%m-%d", "%b %d, %Y"),
            ("%Y%m%d", "%b %d, %Y"),
            ("%Y-%m", "%b %Y"),
            ("%Y%m", "%b %Y"),
            ("%Y", "%Y"),
        )
        for src, dest in patterns:
            try:
                dt = datetime.strptime(value, src)
                return dt.strftime(dest)
            except ValueError:
                continue
        return value

    @staticmethod
    def _period_label(freq: Optional[str]) -> str:
        if not freq:
            return "period"
        normalized = str(freq).strip().upper()
        mapping = {
            "D": "day",
            "DAILY": "day",
            "W": "week",
            "WEEKLY": "week",
            "M": "month",
            "MONTHLY": "month",
            "Q": "quarter",
            "QUARTERLY": "quarter",
            "A": "year",
            "ANNUAL": "year",
            "ANN": "year",
        }
        return mapping.get(normalized, "period")

    @staticmethod
    def _to_float(value: Any) -> Optional[float]:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _fallback_metric(self, category: str, metric_id: str) -> Dict[str, Any]:
        metric = FALLBACK_METRIC_INDEX.get(category, {}).get(metric_id)
        if not metric:
            return {"id": metric_id, "name": metric_id.replace('-', ' ').title(), "detail": "Data unavailable."}
        return dict(metric)

    def _yoy_change(self, series_id: str) -> Optional[Tuple[str, float, Optional[float]]]:
        observations = self._fred_observations(series_id, limit=14)
        if len(observations) < 13:
            return None
        latest = observations[0]
        comp = observations[12]
        latest_val = self._to_float(latest.get("value"))
        comp_val = self._to_float(comp.get("value"))
        if latest_val is None or comp_val in (None, 0.0):
            return None
        yoy = ((latest_val - comp_val) / comp_val) * 100

        prior_yoy = None
        if len(observations) >= 14:
            prev = observations[1]
            prev_comp = observations[13]
            prev_val = self._to_float(prev.get("value"))
            prev_comp_val = self._to_float(prev_comp.get("value"))
            if prev_val is not None and prev_comp_val not in (None, 0.0):
                prior_yoy = ((prev_val - prev_comp_val) / prev_comp_val) * 100

        return latest.get("date", ""), yoy, prior_yoy

    def _mom_change(self, series_id: str) -> Optional[Tuple[str, float, Optional[float]]]:
        observations = self._fred_observations(series_id, limit=3)
        if len(observations) < 2:
            return None
        latest = observations[0]
        prev = observations[1]
        latest_val = self._to_float(latest.get("value"))
        prev_val = self._to_float(prev.get("value"))
        if latest_val is None or prev_val in (None, 0.0):
            return None
        mom = ((latest_val - prev_val) / prev_val) * 100

        prior_mom = None
        if len(observations) >= 3:
            prev_prev = observations[2]
            prev_prev_val = self._to_float(prev_prev.get("value"))
            if prev_prev_val not in (None, 0.0):
                prior_mom = ((prev_val - prev_prev_val) / prev_prev_val) * 100

        return latest.get("date", ""), mom, prior_mom

    def _fred_series_history(
        self,
        series_id: str,
        points: int = 24,
        transform: str | None = None,
        scale: float | None = None,
    ) -> List[Dict[str, Any]]:
        if not self.fred_api_key:
            return []

        extra = 0
        if transform == "yoy_pct":
            extra = 12
        elif transform in {"diff", "mom_pct"}:
            extra = 1

        observations = self._fred_observations(series_id, limit=points + extra + 4)
        if not observations:
            return []

        obs_sorted = list(reversed(observations))  # oldest -> latest
        records: List[Dict[str, Any]] = []

        def apply_scale(value: float) -> float:
            if scale in (None, 0):
                return value
            return value / scale

        if transform == "yoy_pct":
            for idx in range(12, len(obs_sorted)):
                current = self._to_float(obs_sorted[idx].get("value"))
                comp = self._to_float(obs_sorted[idx - 12].get("value"))
                if current is None or comp in (None, 0.0):
                    continue
                value = ((current - comp) / comp) * 100
                records.append({
                    "date": obs_sorted[idx].get("date", ""),
                    "value": round(apply_scale(value), 4),
                })
        elif transform == "mom_pct":
            for idx in range(1, len(obs_sorted)):
                current = self._to_float(obs_sorted[idx].get("value"))
                prev = self._to_float(obs_sorted[idx - 1].get("value"))
                if current is None or prev in (None, 0.0):
                    continue
                value = ((current - prev) / prev) * 100
                records.append({
                    "date": obs_sorted[idx].get("date", ""),
                    "value": round(apply_scale(value), 4),
                })
        elif transform == "diff":
            for idx in range(1, len(obs_sorted)):
                current = self._to_float(obs_sorted[idx].get("value"))
                prev = self._to_float(obs_sorted[idx - 1].get("value"))
                if current is None or prev is None:
                    continue
                value = current - prev
                records.append({
                    "date": obs_sorted[idx].get("date", ""),
                    "value": round(apply_scale(value), 4),
                })
        else:
            for obs in obs_sorted:
                current = self._to_float(obs.get("value"))
                if current is None:
                    continue
                value = apply_scale(current)
                records.append({
                    "date": obs.get("date", ""),
                    "value": round(value, 4),
                })

        if not records:
            return []

        return records[-points:]

    # ---- Metric constructors ---------------------------------------------------

    def _build_unemployment_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("job-market", "unemployment-rate")
        observations = self._fred_observations("UNRATE", limit=2)
        if not observations:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        prev_value = None
        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))

        summary = f"{latest_value:.1f}%"
        detail_parts = [
            f"Unemployment rate for {self._format_date(latest.get('date'))} was {latest_value:.1f}% (seasonally adjusted).",
        ]
        if prev_value is not None:
            detail_parts.append(f"Prior month reading: {prev_value:.1f}%.")
            change = latest_value - prev_value
            metric["delta"] = f"Change vs prior month: {change:+.1f}pp"
        else:
            metric.pop("delta", None)

        metric["summary"] = summary
        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("UNRATE", points=36)
        return metric

    def _build_claims_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("job-market", "initial-jobless-claims")
        observations = self._fred_observations("ICSA", limit=2)
        if not observations:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        prev_value = None
        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))

        summary = f"{int(round(latest_value)):,}"
        detail_parts = [
            f"Initial jobless claims for the week ending {self._format_date(latest.get('date'))} were {int(round(latest_value)):,} (seasonally adjusted).",
        ]
        if prev_value is not None:
            change = latest_value - prev_value
            metric["delta"] = f"Change vs prior week: {change:+,.0f}"
        else:
            metric.pop("delta", None)

        metric["summary"] = summary
        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("ICSA", points=30)
        return metric

    def _build_payrolls_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("job-market", "nonfarm-payrolls")
        observations = self._fred_observations("PAYEMS", limit=2)
        if not observations:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        prev_value = None
        change = None
        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))
            if prev_value is not None:
                change = latest_value - prev_value

        if change is not None:
            metric["summary"] = f"{change:+,.0f}k"
        else:
            metric["summary"] = f"{latest_value:,.0f}k"

        detail_parts = [
            f"Total nonfarm payroll employment reached {latest_value:,.0f}k in {self._format_date(latest.get('date'))}.",
        ]
        if change is not None:
            detail_parts.append(f"Monthly change: {change:+,.0f}k jobs.")
            metric["delta"] = f"Total level: {latest_value:,.0f}k"
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("PAYEMS", points=30, transform="diff")
        return metric

    def _build_cpi_metric(self, series_id: str, category: str, metric_id: str) -> Dict[str, Any]:
        metric = self._fallback_metric(category, metric_id)
        yoy_change = self._yoy_change(series_id)
        if not yoy_change:
            return metric

        date, yoy_value, prior_yoy = yoy_change
        metric["summary"] = f"{yoy_value:.1f}%"
        detail_parts = [
            f"{metric['name']} for {self._format_date(date)} registered {yoy_value:.1f}% year-over-year growth.",
        ]
        if prior_yoy is not None:
            detail_parts.append(f"Prior month pace: {prior_yoy:.1f}%.")
            delta_value = yoy_value - prior_yoy
            metric["delta"] = f"Change vs prior month: {delta_value:+.1f}pp"
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history(series_id, points=30, transform="yoy_pct")
        return metric

    def _build_ppi_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("inflation", "ppi-mom")
        mom_change = self._mom_change("PPIACO")
        if not mom_change:
            return metric

        date, mom_value, prior_mom = mom_change
        metric["summary"] = f"{mom_value:+.2f}%"
        detail_parts = [
            f"Producer prices ({self._format_date(date)}) moved {mom_value:+.2f}% over the month.",
        ]
        if prior_mom is not None:
            detail_parts.append(f"Previous monthly change: {prior_mom:+.2f}%.")
            metric["delta"] = f"Change vs prior month: {(mom_value - prior_mom):+.2f}pp"
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("PPIACO", points=30, transform="mom_pct")
        return metric

    def _build_wti_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("energy", "wti-crude")
        points, meta = self._eia_series("PET.RWTC.D", limit=2)
        if not points:
            return metric

        latest = points[0]
        latest_value = latest["value"]
        freq = (meta or {}).get("frequency")
        period_label = self._period_label(freq)
        units = (meta or {}).get("units")
        description = (meta or {}).get("description")

        metric["summary"] = f"${latest_value:.2f}"

        detail = (
            f"WTI crude oil spot price on {self._format_date(latest['date'])} was ${latest_value:.2f}"
        )
        if units:
            detail += f" ({units})."
        else:
            detail += " per barrel."

        detail_parts = [detail]

        if len(points) > 1:
            prev = points[1]
            detail_parts.append(
                f"Previous {period_label}: ${prev['value']:.2f}."
            )
            change = latest_value - prev["value"]
            metric["delta"] = f"Change vs prior {period_label}: {change:+.2f}"
        else:
            metric.pop("delta", None)

        if description:
            detail_parts.append(description)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._eia_history("PET.RWTC.D", points=90)
        return metric

    def _build_natural_gas_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("energy", "natural-gas")
        points, meta = self._eia_series("NG.RNGWHHD.D", limit=2)
        if not points:
            return metric

        latest = points[0]
        latest_value = latest["value"]
        freq = (meta or {}).get("frequency")
        period_label = self._period_label(freq)
        units = (meta or {}).get("units")
        description = (meta or {}).get("description")

        metric["summary"] = f"${latest_value:.2f}"

        detail = (
            f"Henry Hub natural gas price on {self._format_date(latest['date'])} settled at ${latest_value:.2f}"
        )
        if units:
            detail += f" ({units})."
        else:
            detail += " per MMBtu."

        detail_parts = [detail]

        if len(points) > 1:
            prev = points[1]
            detail_parts.append(
                f"Previous {period_label}: ${prev['value']:.2f}."
            )
            change = latest_value - prev["value"]
            metric["delta"] = f"Change vs prior {period_label}: {change:+.2f}"
        else:
            metric.pop("delta", None)

        if description:
            detail_parts.append(description)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._eia_history("NG.RNGWHHD.D", points=90)
        return metric

    def _build_retail_gasoline_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("energy", "retail-gasoline")
        points, meta = self._eia_series("PET.EMM_EPMRR_PTE_NUS_DPG.W", limit=2)
        if not points:
            return metric

        latest = points[0]
        latest_value = latest["value"]
        freq = (meta or {}).get("frequency")
        period_label = self._period_label(freq)
        units = (meta or {}).get("units")
        description = (meta or {}).get("description")

        metric["summary"] = f"${latest_value:.2f}"

        detail = (
            f"US regular gasoline averaged ${latest_value:.2f} during the week ending {self._format_date(latest['date'])}"
        )
        if units:
            detail += f" ({units})."
        else:
            detail += " per gallon."

        detail_parts = [detail]

        if len(points) > 1:
            prev = points[1]
            detail_parts.append(
                f"Previous {period_label}: ${prev['value']:.2f}."
            )
            change = latest_value - prev["value"]
            metric["delta"] = f"Change vs prior {period_label}: {change:+.2f}"
        else:
            metric.pop("delta", None)

        if description:
            detail_parts.append(description)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._eia_history("PET.EMM_EPMRR_PTE_NUS_DPG.W", points=90)
        return metric

    def _build_industrial_production_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("economic-activities", "industrial-production")
        observations = self._fred_observations("INDPRO", limit=2)
        if len(observations) < 1:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        metric["summary"] = f"{latest_value:.1f}"
        detail_parts = [
            f"Industrial production index (2017 = 100) reached {latest_value:.1f} in {self._format_date(latest.get('date'))}.",
        ]

        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))
            if prev_value not in (None, 0.0):
                detail_parts.append(f"Prior month level: {prev_value:.1f}.")
                pct_change = ((latest_value - prev_value) / prev_value) * 100
                metric["delta"] = f"Change vs prior month: {pct_change:+.2f}%"
            else:
                metric.pop("delta", None)
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("INDPRO", points=36)
        return metric

    def _build_retail_sales_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("economic-activities", "retail-sales")
        observations = self._fred_observations("RSAFS", limit=2)
        if len(observations) < 1:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        summary_value = latest_value / 1000  # convert millions to billions
        metric["summary"] = f"${summary_value:.1f}B"
        detail_parts = [
            f"Advance retail and food services sales totalled ${summary_value:.1f}B in {self._format_date(latest.get('date'))}.",
        ]

        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))
            if prev_value not in (None, 0.0):
                detail_parts.append(f"Prior month: ${prev_value / 1000:.1f}B.")
                pct_change = ((latest_value - prev_value) / prev_value) * 100
                metric["delta"] = f"Change vs prior month: {pct_change:+.2f}%"
            else:
                metric.pop("delta", None)
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("RSAFS", points=36, scale=1000)
        return metric

    def _build_housing_starts_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("economic-activities", "housing-starts")
        observations = self._fred_observations("HOUST", limit=2)
        if len(observations) < 1:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        metric["summary"] = f"{latest_value:,.0f}k"
        detail_parts = [
            f"Housing starts were {latest_value:,.0f}k (annual rate) in {self._format_date(latest.get('date'))}.",
        ]

        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))
            if prev_value is not None:
                detail_parts.append(f"Prior month: {prev_value:,.0f}k.")
                change = latest_value - prev_value
                metric["delta"] = f"Change vs prior month: {change:+,.0f}k"
            else:
                metric.pop("delta", None)
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("HOUST", points=36)
        return metric

    def _build_consumer_sentiment_metric(self) -> Dict[str, Any]:
        metric = self._fallback_metric("economic-activities", "consumer-sentiment")
        observations = self._fred_observations("UMCSENT", limit=2)
        if len(observations) < 1:
            return metric

        latest = observations[0]
        latest_value = self._to_float(latest.get("value"))
        if latest_value is None:
            return metric

        metric["summary"] = f"{latest_value:.1f}"
        detail_parts = [
            f"University of Michigan consumer sentiment read {latest_value:.1f} in {self._format_date(latest.get('date'))}.",
        ]

        if len(observations) > 1:
            prev_value = self._to_float(observations[1].get("value"))
            if prev_value is not None:
                detail_parts.append(f"Prior month: {prev_value:.1f}.")
                change = latest_value - prev_value
                metric["delta"] = f"Change vs prior month: {change:+.1f}"
            else:
                metric.pop("delta", None)
        else:
            metric.pop("delta", None)

        metric["detail"] = " ".join(detail_parts)
        metric["history"] = self._fred_series_history("UMCSENT", points=36)
        return metric

    # ---- Category aggregators --------------------------------------------------

    def _build_job_market_metrics(self) -> List[Dict[str, Any]]:
        return [
            self._build_unemployment_metric(),
            self._build_claims_metric(),
            self._build_payrolls_metric(),
        ]

    def _build_inflation_metrics(self) -> List[Dict[str, Any]]:
        return [
            self._build_cpi_metric("CPIAUCSL", "inflation", "cpi-yoy"),
            self._build_cpi_metric("CPILFESL", "inflation", "core-cpi-yoy"),
            self._build_ppi_metric(),
        ]

    def _build_economic_activity_metrics(self) -> List[Dict[str, Any]]:
        return [
            self._build_industrial_production_metric(),
            self._build_retail_sales_metric(),
            self._build_housing_starts_metric(),
            self._build_consumer_sentiment_metric(),
        ]

    def _build_energy_metrics(self) -> List[Dict[str, Any]]:
        return [
            self._build_wti_metric(),
            self._build_natural_gas_metric(),
            self._build_retail_gasoline_metric(),
        ]

    # ---- public API -------------------------------------------------------------

    def fetch(self) -> Dict[str, Any]:
        categories = [
            {
                "id": "job-market",
                "title": "Job Market",
                "metrics": self._build_job_market_metrics(),
            },
            {
                "id": "inflation",
                "title": "Inflation",
                "metrics": self._build_inflation_metrics(),
            },
            {
                "id": "economic-activities",
                "title": "Economic Activities",
                "metrics": self._build_economic_activity_metrics(),
            },
            {
                "id": "energy",
                "title": "Energy Markets",
                "metrics": self._build_energy_metrics(),
            },
        ]

        return {
            "updated": datetime.utcnow().isoformat(),
            "categories": categories,
        }


def _build_macro_trends_payload(fred_api_key: str, eia_api_key: str) -> Dict[str, Any]:
    service = MacroTrendsService(
        fred_api_key=fred_api_key or "",
        eia_api_key=eia_api_key or "",
    )
    return service.fetch()


def _copy_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    return copy.deepcopy(data)


def _payload_has_timeseries(payload: Dict[str, Any]) -> bool:
    """Return True if any metric has populated history."""
    try:
        categories = payload.get("categories") or []
    except AttributeError:
        return False

    for category in categories:
        metrics = (category or {}).get("metrics") or []
        for metric in metrics:
            history = (metric or {}).get("history")
            if isinstance(history, (list, tuple)) and len(history) > 0:
                return True
    return False


def _cache_expired(ttl_seconds: int | None) -> bool:
    ttl = _CACHE_TTL_SECONDS if ttl_seconds is None else max(ttl_seconds, 0)
    if ttl == 0:
        return False
    now = time.time()
    with _CACHE_LOCK:
        if _CACHE_DATA is None:
            return True
        return (now - _CACHE_TIMESTAMP) > ttl


def _write_cache(payload: Dict[str, Any]) -> None:
    global _CACHE_DATA, _CACHE_TIMESTAMP
    with _CACHE_LOCK:
        _CACHE_DATA = copy.deepcopy(payload)
        _CACHE_TIMESTAMP = time.time()


def _read_cache() -> Optional[Dict[str, Any]]:
    with _CACHE_LOCK:
        if _CACHE_DATA is None:
            return None
        return copy.deepcopy(_CACHE_DATA)


def get_macro_trends(
    fred_api_key: str = "",
    eia_api_key: str = "",
    *,
    use_cache: bool = True,
    ttl_seconds: Optional[int] = None,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """Fetch macro data, optionally reusing the module cache."""

    # Guard against accidental whitespace in environment-provided keys.
    fred_api_key = (fred_api_key or "").strip()
    eia_api_key = (eia_api_key or "").strip()

    if not use_cache:
        payload = _build_macro_trends_payload(fred_api_key, eia_api_key)
        return _copy_payload(payload)

    if not force_refresh:
        cached = _read_cache()
        if cached is not None and not _cache_expired(ttl_seconds):
            if not (fred_api_key or eia_api_key) or _payload_has_timeseries(cached):
                return cached

    payload = _build_macro_trends_payload(fred_api_key, eia_api_key)
    _write_cache(payload)
    return _copy_payload(payload)


def init_macro_trends_cache(
    app,
    *,
    interval_seconds: int = 2 * 60 * 60,
) -> None:
    """Warm the macro cache and keep it refreshed in the background."""

    global _CACHE_THREAD_STARTED, _CACHE_STOP_EVENT

    if _CACHE_THREAD_STARTED:
        return

    fred_key = (app.config.get("FRED_API_KEY") or "").strip()
    eia_key = (app.config.get("EIA_API_KEY") or "").strip()

    if not fred_key and not eia_key:
        # Still cache fallback payload so pages load instantly.
        payload = _build_macro_trends_payload(fred_key, eia_key)
        _write_cache(payload)
        _CACHE_THREAD_STARTED = True
        return

    # Seed cache immediately so the first request is fast.
    try:
        payload = _build_macro_trends_payload(fred_key, eia_key)
        _write_cache(payload)
    except Exception as exc:  # pragma: no cover - defensive logging
        app.logger.warning("[macro] failed to seed macro cache: %s", exc)

    stop_event = Event()
    _CACHE_STOP_EVENT = stop_event

    def refresh_loop():  # pragma: no cover - background worker
        with app.app_context():
            wait_interval = max(interval_seconds, 60)
            while not stop_event.is_set():
                try:
                    payload = _build_macro_trends_payload(fred_key, eia_key)
                    _write_cache(payload)
                    app.logger.debug("[macro] cache refreshed at %s", datetime.utcnow().isoformat())
                except Exception as exc:
                    app.logger.warning("[macro] background refresh failed: %s", exc)
                stop_event.wait(wait_interval)

    thread = Thread(target=refresh_loop, name="macro-trends-cache", daemon=True)
    thread.start()
    _CACHE_THREAD_STARTED = True
