(() => {
  if (typeof Chart === "undefined" || typeof ChartZoom === "undefined") return;

  Chart.register(ChartZoom);

  const canvas = document.getElementById("priceEngagementChart");
  if (!canvas) return;

  const gold =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--fp-accent")
      .trim() || "#c59a36";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const formatTime = (h, m) => `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}`;

  const generateTimeLabels = (start, end, stepMinutes) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const labels = [];
    let h = sh;
    let m = sm;
    while (h < eh || (h === eh && m <= em)) {
      labels.push(formatTime(h, m));
      m += stepMinutes;
      while (m >= 60) {
        m -= 60;
        h += 1;
      }
    }
    return labels;
  };

  const labels = generateTimeLabels("09:00", "13:30", 10);
  const total = labels.length - 1;

  const priceData = labels.map((_, i) => {
    const t = i / total;
    let base;
    if (t < 0.45) base = 100 + 10 * (t / 0.45);
    else if (t < 0.65) base = 110 + 10 * ((t - 0.45) / 0.2);
    else if (t < 0.8) base = 120 - 2 * ((t - 0.65) / 0.15);
    else base = 118 + 7 * ((t - 0.8) / 0.2);
    return clamp(base + (Math.random() - 0.5) * 0.8, 100, 125);
  });

  const engagementData = labels.map((_, i) => {
    const t = i / total;
    let base;
    if (t < 0.45) base = 25 + 63 * (t / 0.45);
    else if (t < 0.8) base = 88 - 30 * ((t - 0.45) / 0.35);
    else base = 58 - 8 * ((t - 0.8) / 0.2);
    return clamp(base + (Math.random() - 0.5) * 3, 0, 100);
  });

  const colourForEngagement = (value0to100) => {
    const v = clamp(value0to100, 0, 100);
    const hue = (v / 100) * 120;
    return `hsl(${hue} 70% 48%)`;
  };

  const ENG_JOLT = 7.5;
  const PRICE_JOLT = 1.2;
  const isNotableIndex = (i) => {
    if (i <= 0) return false;
    const dE = engagementData[i] - engagementData[i - 1];
    const dP = priceData[i] - priceData[i - 1];
    return Math.abs(dE) >= ENG_JOLT || Math.abs(dP) >= PRICE_JOLT;
  };

  const engagementUnderlay = {
    id: "engagementUnderlay",
    beforeDatasetsDraw(chart, args, pluginOptions) {
      const dsIndex = pluginOptions?.datasetIndex ?? 1;
      const alpha = pluginOptions?.alpha ?? 0.18;
      const minSegmentPx = pluginOptions?.minSegmentPx ?? 2;

      const meta = chart.getDatasetMeta(dsIndex);
      if (!meta || meta.hidden) return;

      const y1 = chart.scales?.y1;
      if (!y1) return;

      const pts = meta.data;
      if (!pts || pts.length < 2) return;

      const baseY = y1.getPixelForValue(0);
      const ctx = chart.ctx;

      ctx.save();
      ctx.globalAlpha = alpha;

      const { left, top, right, bottom } = chart.chartArea;
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        if (!p0 || !p1 || isNaN(p0.x) || isNaN(p1.x) || isNaN(p0.y) || isNaN(p1.y)) continue;

        const width = Math.abs(p1.x - p0.x);
        if (width < minSegmentPx) continue;

        const value = engagementData[i];
        ctx.fillStyle = colourForEngagement(value);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p1.x, baseY);
        ctx.lineTo(p0.x, baseY);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  };

  Chart.register(engagementUnderlay);

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
          borderWidth: 2.4,
          tension: 0.35,
          yAxisID: "y",
          pointRadius: (ctx) => (isNotableIndex(ctx.dataIndex) ? 2.5 : 0),
          pointHoverRadius: 5,
          pointHitRadius: 16,
          fill: false
        },
        {
          label: "Engagement Index",
          data: engagementData,
          borderColor: gold,
          segment: {
            borderColor: (ctx) => {
              const y = ctx?.p1?.parsed?.y;
              return typeof y === "number" ? colourForEngagement(y) : gold;
            }
          },
          backgroundColor: "rgba(197, 154, 54, 0.08)",
          borderWidth: 2.2,
          borderDash: [6, 6],
          tension: 0.35,
          yAxisID: "y1",
          pointRadius: (ctx) => (isNotableIndex(ctx.dataIndex) ? 2.5 : 0),
          pointHoverRadius: 5,
          pointHitRadius: 16,
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
          position: "top",
          align: "center",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            generateLabels(chartInstance) {
              return chartInstance.data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: "rgba(0,0,0,0)",
                strokeStyle: dataset.label === "Engagement Index" ? gold : dataset.borderColor,
                lineWidth: 2,
                hidden: !chartInstance.isDatasetVisible(i),
                datasetIndex: i,
                pointStyle: "circle"
              }));
            }
          }
        },
        tooltip: {
          enabled: false,
          external: (context) => {
            const tooltipEl = document.getElementById("fpTooltip");
            if (!tooltipEl) return;
            const { tooltip } = context;

            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            const items = tooltip.dataPoints || [];
            const i = items?.[0]?.dataIndex ?? 0;

            const price = priceData[i];
            const eng = engagementData[i];
            const prevPrice = i > 0 ? priceData[i - 1] : null;
            const prevEng = i > 0 ? engagementData[i - 1] : null;
            const dP = prevPrice == null ? null : price - prevPrice;
            const dE = prevEng == null ? null : eng - prevEng;

            const priceDir = dP == null ? "—" : dP > 0.01 ? "up" : dP < -0.01 ? "down" : "flat";
            const engDir = dE == null ? "—" : dE > 0.2 ? "rising" : dE < -0.2 ? "falling" : "steady";
            const divergence =
              dP != null && dE != null && ((dP > 0 && dE < 0) || (dP < 0 && dE > 0)) ? "Divergence" : "Alignment";
            const intensity = dE != null && Math.abs(dE) >= ENG_JOLT ? "High momentum" : "Normal momentum";

            const sign = (x) => (x == null ? "" : x >= 0 ? "+" : "");
            const chipColour = colourForEngagement(eng);

            tooltipEl.innerHTML = `
              <div class="fp-tooltip__top">
                <div class="fp-tooltip__time">${labels[i] ? `Time: ${labels[i]}` : ""}</div>
                <div class="fp-tooltip__chip" style="border-color: color-mix(in srgb, ${chipColour} 35%, rgba(60,44,28,0.12)); background: color-mix(in srgb, ${chipColour} 14%, rgba(255,255,255,0.88));">
                  <span style="width:8px;height:8px;border-radius:999px;background:${chipColour};display:inline-block"></span>
                  ${divergence} • ${intensity}
                </div>
              </div>

              <div class="fp-tooltip__grid">
                <div class="fp-tooltip__metric">
                  <div class="fp-tooltip__label">Asset price</div>
                  <div class="fp-tooltip__value">${price.toFixed(2)}</div>
                  <div class="fp-tooltip__delta">Δ ${dP == null ? "—" : `${sign(dP)}${dP.toFixed(2)}`} • ${priceDir}</div>
                </div>
                <div class="fp-tooltip__metric">
                  <div class="fp-tooltip__label">Engagement</div>
                  <div class="fp-tooltip__value">${eng.toFixed(1)} <span style="font-weight:550;color:rgba(42,35,27,0.62)">pts</span></div>
                  <div class="fp-tooltip__delta">Δ ${dE == null ? "—" : `${sign(dE)}${dE.toFixed(1)} pts`} • ${engDir}</div>
                </div>
              </div>

              <div class="fp-tooltip__insight">
                <strong>Read:</strong> ${divergence === "Divergence"
                  ? "attention is moving against the price direction — check whether this is positioning, headlines, or a liquidity-driven move."
                  : "price direction is supported by engagement — signal is more likely to persist if follow-through continues."}
              </div>
            `;

            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = `${tooltip.caretX}px`;
            tooltipEl.style.top = `${tooltip.caretY}px`;
          }
        },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x"
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0)", drawBorder: false },
          ticks: {
            color: "#7a7a7a",
            callback(value, index) {
              return index % 3 === 0 ? this.getLabelForValue(value) : "";
            }
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

})();
