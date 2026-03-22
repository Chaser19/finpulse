let pluginsRegistered = false;

const labels = (() => {
  const output = [];
  let hour = 9;
  let minute = 0;
  while (hour < 13 || (hour === 13 && minute <= 30)) {
    output.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    minute += 10;
    while (minute >= 60) {
      minute -= 60;
      hour += 1;
    }
  }
  return output;
})();

const priceData = [
  100.1, 100.9, 101.7, 102.4, 103.2, 104.1, 105.3, 106.2, 107.1,
  108.4, 109.3, 110.1, 111.2, 112.4, 113.1, 114.2, 115.7, 116.8,
  118.2, 119.4, 120.1, 119.5, 118.8, 118.3, 118.1, 119.3, 120.7, 122.1
];

const engagementData = [
  25, 28, 31, 35, 39, 44, 49, 56, 63,
  70, 76, 82, 88, 85, 81, 75, 69, 63,
  58, 55, 54, 53, 52, 51, 50, 49, 47, 45
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const colourForEngagement = (value0to100) => {
  const value = clamp(value0to100, 0, 100);
  const hue = (value / 100) * 120;
  return `hsl(${hue} 70% 48%)`;
};

const registerPlugins = (gold) => {
  if (pluginsRegistered || typeof Chart === "undefined") {
    return;
  }

  if (typeof ChartZoom !== "undefined") {
    Chart.register(ChartZoom);
  }

  Chart.register({
    id: "engagementUnderlay",
    beforeDatasetsDraw(chart, args, pluginOptions) {
      const dsIndex = pluginOptions?.datasetIndex ?? 1;
      const alpha = pluginOptions?.alpha ?? 0.18;
      const minSegmentPx = pluginOptions?.minSegmentPx ?? 2;

      const meta = chart.getDatasetMeta(dsIndex);
      if (!meta || meta.hidden) {
        return;
      }

      const y1 = chart.scales?.y1;
      if (!y1) {
        return;
      }

      const points = meta.data;
      if (!points || points.length < 2) {
        return;
      }

      const baseY = y1.getPixelForValue(0);
      const ctx = chart.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;

      const { left, top, right, bottom } = chart.chartArea;
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();

      for (let index = 1; index < points.length; index += 1) {
        const pointA = points[index - 1];
        const pointB = points[index];
        if (!pointA || !pointB || Number.isNaN(pointA.x) || Number.isNaN(pointB.x) || Number.isNaN(pointA.y) || Number.isNaN(pointB.y)) {
          continue;
        }

        const width = Math.abs(pointB.x - pointA.x);
        if (width < minSegmentPx) {
          continue;
        }

        ctx.fillStyle = colourForEngagement(engagementData[index]);
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.lineTo(pointB.x, baseY);
        ctx.lineTo(pointA.x, baseY);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  });

  pluginsRegistered = true;
};

const createExternalTooltip = (root, gold) => (context) => {
  const tooltipEl = root.querySelector("[data-mission-tooltip]");
  if (!tooltipEl) {
    return;
  }

  const { tooltip } = context;
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  const index = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
  const price = priceData[index];
  const engagement = engagementData[index];
  const prevPrice = index > 0 ? priceData[index - 1] : null;
  const prevEngagement = index > 0 ? engagementData[index - 1] : null;
  const priceDelta = prevPrice == null ? null : price - prevPrice;
  const engagementDelta = prevEngagement == null ? null : engagement - prevEngagement;
  const sign = (value) => (value == null ? "" : value >= 0 ? "+" : "");
  const divergence =
    priceDelta != null &&
    engagementDelta != null &&
    ((priceDelta > 0 && engagementDelta < 0) || (priceDelta < 0 && engagementDelta > 0))
      ? "Divergence"
      : "Alignment";
  const chipColour = colourForEngagement(engagement);

  tooltipEl.innerHTML = `
    <div class="fp-tooltip__top">
      <div class="fp-tooltip__time">Time: ${labels[index] || ""}</div>
      <div class="fp-tooltip__chip" style="border-color: color-mix(in srgb, ${chipColour} 35%, rgba(60,44,28,0.12)); background: color-mix(in srgb, ${chipColour} 14%, rgba(255,255,255,0.88));">
        <span style="width:8px;height:8px;border-radius:999px;background:${chipColour};display:inline-block"></span>
        ${divergence}
      </div>
    </div>
    <div class="fp-tooltip__grid">
      <div class="fp-tooltip__metric">
        <div class="fp-tooltip__label">Asset price</div>
        <div class="fp-tooltip__value">${price.toFixed(2)}</div>
        <div class="fp-tooltip__delta">Δ ${priceDelta == null ? "—" : `${sign(priceDelta)}${priceDelta.toFixed(2)}`}</div>
      </div>
      <div class="fp-tooltip__metric">
        <div class="fp-tooltip__label">Engagement</div>
        <div class="fp-tooltip__value">${engagement.toFixed(1)} <span style="font-weight:550;color:rgba(42,35,27,0.62)">pts</span></div>
        <div class="fp-tooltip__delta">Δ ${engagementDelta == null ? "—" : `${sign(engagementDelta)}${engagementDelta.toFixed(1)} pts`}</div>
      </div>
    </div>
    <div class="fp-tooltip__insight">
      <strong>Read:</strong> ${
        divergence === "Divergence"
          ? "attention is moving against the price direction — check whether this is positioning, headlines, or a liquidity-driven move."
          : "price direction is supported by engagement — signal is more likely to persist if follow-through continues."
      }
    </div>
  `;

  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = `${tooltip.caretX}px`;
  tooltipEl.style.top = `${tooltip.caretY}px`;
};

export const initMissionEngagementChart = (root, options = {}) => {
  if (typeof Chart === "undefined" || !root) {
    return () => {};
  }

  const variant = options.variant || root.dataset.missionView || "desktop";
  const canvas = root.querySelector(`[data-mission-chart][data-mission-chart-variant="${variant}"]`);
  if (!canvas) {
    return () => {};
  }

  const gold = getComputedStyle(document.documentElement).getPropertyValue("--fp-accent").trim() || "#c59a36";
  registerPlugins(gold);

  const isDesktop = variant === "desktop";
  const chart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Asset Price",
          data: priceData,
          borderColor: "#1c1c1c",
          backgroundColor: "transparent",
          borderWidth: isDesktop ? 2.4 : 2.1,
          tension: 0.35,
          yAxisID: "y",
          pointRadius: 0,
          pointHoverRadius: isDesktop ? 5 : 4,
          pointHitRadius: isDesktop ? 16 : 22,
          fill: false
        },
        {
          label: "Engagement Index",
          data: engagementData,
          borderColor: gold,
          segment: {
            borderColor: (ctx) => {
              const value = ctx?.p1?.parsed?.y;
              return typeof value === "number" ? colourForEngagement(value) : gold;
            }
          },
          backgroundColor: "rgba(197, 154, 54, 0.08)",
          borderWidth: 2.2,
          borderDash: [6, 6],
          tension: 0.35,
          yAxisID: "y1",
          pointRadius: 0,
          pointHoverRadius: isDesktop ? 5 : 4,
          pointHitRadius: isDesktop ? 16 : 22,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        engagementUnderlay: {
          datasetIndex: 1,
          alpha: 0.16,
          minSegmentPx: 1
        },
        legend: {
          position: isDesktop ? "top" : "bottom",
          align: "center",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            generateLabels(chartInstance) {
              return chartInstance.data.datasets.map((dataset, index) => ({
                text: dataset.label,
                fillStyle: "rgba(0,0,0,0)",
                strokeStyle: dataset.label === "Engagement Index" ? gold : dataset.borderColor,
                lineWidth: 2,
                hidden: !chartInstance.isDatasetVisible(index),
                datasetIndex: index,
                pointStyle: "circle"
              }));
            }
          }
        },
        tooltip: isDesktop
          ? {
              enabled: false,
              external: createExternalTooltip(root, gold)
            }
          : {
              enabled: true,
              backgroundColor: "rgba(33, 28, 21, 0.92)",
              padding: 10,
              titleFont: { weight: "700" },
              callbacks: {
                title(items) {
                  return items?.[0]?.label || "";
                },
                label(context) {
                  const value = Number(context.raw || 0);
                  return context.dataset.label === "Asset Price" ? `Asset price: ${value.toFixed(2)}` : `Engagement: ${value.toFixed(1)} pts`;
                }
              }
            },
        zoom: isDesktop && typeof ChartZoom !== "undefined"
          ? {
              pan: { enabled: true, mode: "x" },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: "x"
              }
            }
          : undefined
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0)", drawBorder: false },
          ticks: {
            color: "#7a7a7a",
            callback(value, index) {
              const every = isDesktop ? 3 : 4;
              return index % every === 0 ? this.getLabelForValue(value) : "";
            },
            maxRotation: 0
          }
        },
        y: {
          position: "left",
          min: 100,
          max: 125,
          grid: { color: "#e8e8e8", drawBorder: false },
          ticks: { color: "#7a7a7a" }
        },
        y1: {
          position: "right",
          min: 0,
          max: 100,
          grid: { color: "#e8e8e8", drawBorder: false },
          ticks: { color: gold }
        }
      }
    }
  });

  return () => {
    const tooltipEl = root.querySelector("[data-mission-tooltip]");
    if (tooltipEl) {
      tooltipEl.style.opacity = 0;
      tooltipEl.innerHTML = "";
    }
    chart.destroy();
  };
};
