// static/js/macro-charts.js
(function () {
  function parseHistory(el) {
    const raw = el.dataset.history;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[macro] unable to parse history payload', err);
      return [];
    }
  }

  function normaliseSeries(series) {
    return series
      .filter((point) => point && typeof point.value === 'number' && isFinite(point.value))
      .map((point) => ({
        date: point.date,
        value: point.value,
      }));
  }

  function formatValue(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
    if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (value / 1_000).toFixed(0) + 'k';
    if (abs >= 100) return value.toFixed(0);
    if (abs >= 1) return value.toFixed(1).replace(/\.0$/, '');
    return value.toFixed(2).replace(/\.00$/, '');
  }

  function toDate(value) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value + 'T00:00:00Z');
      if (!Number.isNaN(date.getTime())) return date;
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      const date = new Date(`${value}-01T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) return date;
    }
    if (/^\d{6}$/.test(value)) {
      const year = value.slice(0, 4);
      const month = value.slice(4, 6);
      const date = new Date(`${year}-${month}-01T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) return date;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  }

  function formatDateLabel(value) {
    const date = toDate(value);
    if (!date) return value;
    const hasDay = /\d{4}-\d{2}-\d{2}$/.test(value);
    if (hasDay) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
  }

  function drawSparkline(canvas, series) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement;
    const containerWidth = container ? container.clientWidth : 0;
    const targetHeight = parseInt(canvas.dataset.chartHeight || '', 10) || 180;
    const width = Math.max(containerWidth || rect.width || canvas.clientWidth || 260, 160);
    const dynamicHeight = Math.round(width * 0.4);
    const height = Math.max(targetHeight, dynamicHeight);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 16, right: 12, bottom: 28, left: 52 };
    const plotWidth = Math.max(width - padding.left - padding.right, 16);
    const plotHeight = Math.max(height - padding.top - padding.bottom, 16);

    const values = series.map((point) => point.value);
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = max - min || 1;
    const stepX = plotWidth / Math.max(series.length - 1, 1);

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();

    // Y ticks
    const tickCount = 4;
    ctx.fillStyle = 'rgba(191, 219, 254, 0.85)';
    ctx.font = '10px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < tickCount; i += 1) {
      const value = min + (span * i) / (tickCount - 1);
      const y = padding.top + plotHeight - ((value - min) / span) * plotHeight;
      if (i !== 0 && i !== tickCount - 1) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotWidth, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(191, 219, 254, 0.85)';
      ctx.fillText(formatValue(value), padding.left - 8, y);
    }

    // Data path
    const path = new Path2D();
    series.forEach((point, idx) => {
      const x = padding.left + idx * stepX;
      const y = padding.top + plotHeight - ((point.value - min) / span) * plotHeight;
      if (idx === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    });

    const fill = new Path2D(path);
    const lastPointX = padding.left + (series.length - 1) * stepX;
    fill.lineTo(lastPointX, padding.top + plotHeight);
    fill.lineTo(padding.left, padding.top + plotHeight);
    fill.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fill(fill);

    ctx.strokeStyle = 'rgba(96, 165, 250, 0.95)';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    // Latest marker
    const last = series[series.length - 1];
    const lastY = padding.top + plotHeight - ((last.value - min) / span) * plotHeight;
    ctx.fillStyle = 'rgba(224, 231, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(lastPointX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // X labels
    ctx.fillStyle = 'rgba(191, 219, 254, 0.85)';
    ctx.font = '10px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelIndexes = [0, Math.floor(series.length / 2), series.length - 1];
    const seen = new Set();
    labelIndexes.forEach((idx) => {
      if (idx < 0 || idx >= series.length || seen.has(idx)) return;
      seen.add(idx);
      const point = series[idx];
      const x = padding.left + idx * stepX;
      ctx.fillText(formatDateLabel(point.date), x, padding.top + plotHeight + 6);
    });
  }

  function renderChart(canvas) {
    const history = normaliseSeries(parseHistory(canvas));
    if (!history.length) {
      canvas.classList.add('d-none');
      return;
    }
    drawSparkline(canvas, history);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const canvases = Array.from(document.querySelectorAll('.macro-chart[data-history]'));
    if (!canvases.length) return;

    const renderAll = () => canvases.forEach((canvas) => renderChart(canvas));
    renderAll();

    let resizeFrame = null;
    window.addEventListener('resize', () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(renderAll);
    });

    if ('ResizeObserver' in window) {
      const observers = new Map();
      canvases.forEach((canvas) => {
        const container = canvas.parentElement;
        if (!container || observers.has(container)) return;
        const observer = new ResizeObserver(() => renderChart(canvas));
        observer.observe(container);
        observers.set(container, observer);
      });
    }

    canvases.forEach((canvas) => {
      const details = canvas.closest('details');
      if (!details) return;
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        requestAnimationFrame(() => renderChart(canvas));
      });
    });
  });
})();
