// static/js/macro-trends.js
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TREND_ENDPOINT = '/api/macro/trends';
  const ICON_LABELS = {
    'job-market': 'LAB',
    inflation: 'CPI',
    'economic-activities': 'ACT',
  };

  const FALLBACK = {
    updated: new Date().toISOString(),
    categories: [
      {
        id: 'job-market',
        title: 'Job Market',
        metrics: [
          {
            id: 'unemployment-rate',
            name: 'Unemployment rate',
            summary: 'Latest reading: 3.8%',
            detail: 'Unemployment remains historically low with only a marginal uptick versus the prior month.',
            delta: 'Change vs prior month: +0.1pp',
          },
          {
            id: 'initial-jobless-claims',
            name: 'Initial jobless claims',
            summary: 'Trailing 4-week avg near 230k',
            detail: 'Claims continue to hover near cycle lows, signalling a resilient labour market.',
          },
          {
            id: 'nonfarm-payrolls',
            name: 'Nonfarm payrolls',
            summary: '+187k jobs added last print',
            detail: 'Payroll growth cooled from the prior month but still outpaces pre-pandemic trend.',
          },
        ],
      },
      {
        id: 'inflation',
        title: 'Inflation',
        metrics: [
          {
            id: 'cpi-yoy',
            name: 'CPI (YoY)',
            summary: '3.2% YoY',
            detail: 'Headline CPI edged higher on energy while core services inflation stays sticky.',
          },
          {
            id: 'core-cpi-yoy',
            name: 'Core CPI (YoY)',
            summary: '4.1% YoY',
            detail: 'Core CPI eased modestly thanks to softer shelter and used car prices.',
          },
          {
            id: 'ppi-mom',
            name: 'PPI (MoM)',
            summary: '+0.2% MoM',
            detail: 'Producer prices climbed on higher goods costs while services categories softened.',
          },
        ],
      },
      {
        id: 'economic-activities',
        title: 'Economic Activities',
        metrics: [
          {
            id: 'industrial-production',
            name: 'Industrial production index',
            summary: '103.9',
            detail: 'Factory output and utilities production remain above the 2017 base-year average.',
          },
          {
            id: 'retail-sales',
            name: 'Retail sales (advance)',
            summary: '$704B',
            detail: 'Consumer spending is broad-based with goods and dining both contributing to growth.',
          },
          {
            id: 'housing-starts',
            name: 'Housing starts',
            summary: '1,360k',
            detail: 'Builders remain cautious as financing costs bite, leaving starts slightly softer.',
          },
          {
            id: 'consumer-sentiment',
            name: 'Consumer sentiment (UMich)',
            summary: '68.0',
            detail: 'Households remain watchful but steady as labour-market optimism offsets price concerns.',
          },
        ],
      },
    ],
  };

  async function fetchTrends() {
    try {
      const res = await fetch(TREND_ENDPOINT, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.warn('[macro] falling back to static trends:', err);
      return FALLBACK;
    }
  }

  function firstSentence(text) {
    if (!text) return '';
    const normalized = String(text).trim();
    if (!normalized) return '';
    const match = normalized.match(/(.+?[.!?])(?=\s|$)/);
    const sentence = (match ? match[1] : normalized).trim();
    if (sentence.length > 180) {
      return sentence.slice(0, 177) + '…';
    }
    return sentence;
  }

  function buildSparkline(history) {
    const points = (Array.isArray(history) ? history : [])
      .map((entry) => {
        const raw =
          entry?.value ??
          entry?.close ??
          entry?.price ??
          entry?.rate ??
          entry?.level ??
          entry?.amount;
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
      })
      .filter((val) => val !== null);

    if (points.length < 2) return null;

    const width = 220;
    const height = 76;
    const paddingX = 8;
    const paddingY = 6;
    const step = (width - paddingX * 2) / (points.length - 1 || 1);

    const minValue = Math.min(...points);
    const maxValue = Math.max(...points);
    const range = maxValue - minValue || 1;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('macro-sparkline');

    const baseline = document.createElementNS(SVG_NS, 'line');
    baseline.setAttribute('x1', '0');
    baseline.setAttribute('y1', String(height - paddingY));
    baseline.setAttribute('x2', String(width));
    baseline.setAttribute('y2', String(height - paddingY));
    baseline.setAttribute('class', 'macro-sparkline-baseline');
    svg.appendChild(baseline);

    const path = document.createElementNS(SVG_NS, 'path');
    let d = '';
    points.forEach((val, idx) => {
      const x = paddingX + idx * step;
      const ratio = (val - minValue) / range;
      const y = paddingY + (1 - ratio) * (height - paddingY * 2);
      d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    path.setAttribute('d', d);
    path.setAttribute('class', 'macro-sparkline-path');
    if (points[points.length - 1] < points[0]) {
      path.classList.add('down');
    }
    svg.appendChild(path);

    return svg;
  }

  function buildMeta(metric) {
    if (!metric) return '';
    const parts = [];
    if (metric.summary) parts.push(metric.summary);
    if (metric.delta) parts.push(metric.delta);
    return parts.join(' • ');
  }

  function renderMetricList(listNode, metrics) {
    if (!listNode) return;
    listNode.innerHTML = '';
    if (!Array.isArray(metrics) || !metrics.length) {
      return;
    }

    metrics.slice(0, 3).forEach((metric) => {
      const li = document.createElement('li');
      const row = document.createElement('div');
      row.className = 'macro-overview-stat';

      const textWrap = document.createElement('div');
      textWrap.className = 'macro-overview-stat-text';

      const title = document.createElement('div');
      title.className = 'macro-overview-stat-label';
      title.textContent = metric.name || 'Metric';
      textWrap.appendChild(title);

      const subtextRaw = metric.delta || firstSentence(metric.detail || '');
      if (subtextRaw) {
        const subtext = document.createElement('div');
        subtext.className = 'text-muted small';
        subtext.textContent = subtextRaw;
        textWrap.appendChild(subtext);
      }

      const value = document.createElement('div');
      value.className = 'macro-overview-stat-value';
      value.textContent = metric.summary || '—';

      row.appendChild(textWrap);
      row.appendChild(value);
      li.appendChild(row);
      listNode.appendChild(li);
    });
  }

  function renderCategory(card, category, detailBase) {
    if (!card) return;
    const metrics = Array.isArray(category.metrics) ? category.metrics : [];
    const primary = metrics[0] || {};

    if (card.tagName === 'A') {
      if (detailBase) {
        card.href = `${detailBase}#${category.id}`;
      }
      const title = category.title || 'Macro trends';
      card.setAttribute('aria-label', `Open ${title}`);
    }

    const icon = card.querySelector('.macro-overview-icon');
    if (icon) {
      const label = ICON_LABELS[category.id] || '•';
      icon.textContent = label;
    }

    const blurbNode = card.querySelector('[data-role="blurb"]');
    if (blurbNode) {
      const blurb =
        firstSentence(primary.detail || '') ||
        firstSentence(primary.summary || '') ||
        'Latest update pending.';
      blurbNode.textContent = blurb;
    }

    const sparkHolder = card.querySelector('[data-role="spark"]');
    if (sparkHolder) {
      sparkHolder.innerHTML = '';
      const spark = buildSparkline(primary.history);
      if (spark) {
        sparkHolder.appendChild(spark);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'macro-spark-placeholder';
        placeholder.textContent = 'Awaiting chart';
        sparkHolder.appendChild(placeholder);
      }
    }

    const metaNode = card.querySelector('[data-role="spark-meta"]');
    if (metaNode) {
      const meta = buildMeta(primary) || firstSentence(primary.detail || '');
      metaNode.textContent = meta || '';
    }

    const metricsList = card.querySelector('[data-role="metrics"]');
    renderMetricList(metricsList, metrics);
  }

  function render(data) {
    const root = document.getElementById('macro-trends');
    if (!root) return;
    const detailBase = root.dataset?.detailUrl || '/macro-trends';
    const categories = Array.isArray(data.categories) ? data.categories : FALLBACK.categories;

    categories.forEach((category) => {
      const card = root.querySelector(`[data-category="${category.id}"]`);
      if (card) {
        renderCategory(card, category, detailBase);
      }
    });

    const timestampNode = document.querySelector('.macro-updated');
    if (timestampNode) {
      const updated = data.updated || FALLBACK.updated;
      timestampNode.textContent = 'Updated ' + new Date(updated).toLocaleString();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('macro-trends');
    if (!root) return;
    const data = await fetchTrends();
    render(data || FALLBACK);
  });
})();
