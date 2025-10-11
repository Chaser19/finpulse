// static/js/macro-trends.js
(function () {
  const TREND_ENDPOINT = '/api/macro/trends';
  const CATEGORY_TARGETS = {
    'job-market': 'macro-job-market',
    inflation: 'macro-inflation',
    'economic-activities': 'macro-economic-activities',
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

  function renderMetric(parent, detailBase, categoryId, metric) {
    const metricId = metric.id || Math.random().toString(36).slice(2);
    const item = document.createElement('li');
    item.className = 'macro-snapshot-item';

    const link = document.createElement('a');
    link.className = 'macro-snapshot-link';
    link.href = `${detailBase}#${categoryId}-${metricId}`;
    link.setAttribute('aria-label', `View ${metric.name || 'metric'} details`);

    const line = document.createElement('div');
    line.className = 'macro-snapshot-line';

    const label = document.createElement('span');
    label.className = 'macro-snapshot-label';
    label.textContent = metric.name || 'Metric';

    const change = document.createElement('span');
    change.className = 'macro-snapshot-delta';
    change.textContent = metric.delta || metric.summary || '—';

    line.appendChild(label);
    line.appendChild(change);
    link.appendChild(line);

    item.appendChild(link);
    parent.appendChild(item);
  }

  function renderCategories(root, categories) {
    const detailBase = root?.dataset?.detailUrl || '/macro-trends';
    (categories || []).forEach((category) => {
      const targetId = CATEGORY_TARGETS[category.id];
      if (!targetId) return;
      const container = document.getElementById(targetId);
      if (!container) return;
      container.innerHTML = '';
      const metrics = Array.isArray(category.metrics) ? category.metrics : [];
      metrics.slice(0, 3).forEach((metric) => renderMetric(container, detailBase, category.id, metric));
    });
  }

  function render(data) {
    const root = document.getElementById('macro-trends');
    if (!root) return;
    const categories = Array.isArray(data.categories) ? data.categories : FALLBACK.categories;
    renderCategories(root, categories);

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
