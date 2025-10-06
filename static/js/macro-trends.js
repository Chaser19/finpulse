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

  function truncate(text, maxLength) {
    if (!text) return '';
    const trimmed = String(text).trim().replace(/\s+/g, ' ');
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.slice(0, maxLength - 3) + '...';
  }

  function renderMetric(parent, detailBase, categoryId, metric) {
    const metricId = metric.id || Math.random().toString(36).slice(2);
    const link = document.createElement('a');
    link.className = 'macro-metric-link';
    link.href = `${detailBase}#${categoryId}-${metricId}`;
    link.setAttribute('aria-label', `View ${metric.name || 'metric'} details`);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'macro-metric-text';

    const name = document.createElement('span');
    name.className = 'macro-metric-name';
    name.textContent = metric.name || 'Metric';
    textWrapper.appendChild(name);

    const summary = document.createElement('span');
    summary.className = 'macro-metric-summary';
    const summaryText = metric.summary || truncate(metric.detail, 80) || 'View full details';
    summary.textContent = summaryText;
    textWrapper.appendChild(summary);

    const chevron = document.createElement('span');
    chevron.className = 'macro-metric-chevron';
    chevron.textContent = '>';

    link.appendChild(textWrapper);
    link.appendChild(chevron);

    parent.appendChild(link);
  }

  function renderCategories(root, categories) {
    const detailBase = root?.dataset?.detailUrl || '/macro-trends';
    (categories || []).forEach((category) => {
      const targetId = CATEGORY_TARGETS[category.id];
      if (!targetId) return;
      const container = document.getElementById(targetId);
      if (!container) return;
      container.innerHTML = '';
      (category.metrics || []).forEach((metric) => renderMetric(container, detailBase, category.id, metric));
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
