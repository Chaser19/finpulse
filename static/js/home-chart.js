(() => {
  if (typeof Chart === "undefined" || typeof ChartZoom === "undefined") {
    return;
  }

  Chart.register(ChartZoom);

  const canvas = document.getElementById("priceEngagementChart");
  if (!canvas) return;

  const gold = getComputedStyle(document.documentElement).getPropertyValue("--fp-accent").trim() || "#c59a36";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const formatTime = (h, m) => `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

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
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 14,
          fill: false
        },
        {
          label: "Engagement Index",
          data: engagementData,
          borderColor: gold,
          backgroundColor: "rgba(197, 154, 54, 0.12)",
          borderWidth: 2.2,
          borderDash: [6, 6],
          tension: 0.35,
          yAxisID: "y1",
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 14,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "top",
          align: "center",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            generateLabels(chart) {
              return chart.data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: "rgba(0,0,0,0)",
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i,
                pointStyle: "circle"
              }));
            }
          }
        },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x"
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x"
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0)",
            drawBorder: false
          },
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
          grid: {
            color: "#e8e8e8",
            drawBorder: false
          },
          ticks: {
            color: "#7a7a7a"
          }
        },
        y1: {
          position: "right",
          min: 0,
          max: 100,
          grid: {
            color: "#e8e8e8",
            drawBorder: false
          },
          ticks: {
            color: gold
          }
        }
      }
    }
  });

})();
