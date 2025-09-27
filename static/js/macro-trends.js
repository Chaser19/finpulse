// static/js/macro-trends.js
(function () {
  const TREND_ENDPOINT = '/api/macro/trends';
  const FALLBACK = {
    updated: new Date().toISOString(),
    buckets: {
      inflation: [
        'Headline CPI cooled to 2.9% YoY while services inflation remains sticky.',
        'Futures price in two 25bp cuts by year-end; Fed speakers stay data-dependent.',
      ],
      growth: [
        'US ISM Manufacturing climbed above 50 for the first time in 18 months.',
        'Global PMIs show mixed signals: eurozone stabilising, China demand still soft.',
      ],
      commodities: [
        'Brent crude hovers near $85 as OPEC+ extends voluntary cuts into Q1.',
        'Gold holds above $2,100 amid safe-haven flows and dovish USD tone.',
      ],
      geopolitics: [
        'Middle East tensions keep shipping costs elevated; Red Sea detours persist.',
        'US election rhetoric ramps up, adding policy uncertainty to fiscal outlook.',
      ],
    },
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

  function renderBucket(rootId, items) {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.innerHTML = '';
    (items || []).forEach((line) => {
      const li = document.createElement('li');
      li.className = 'macro-line';
      li.textContent = line;
      root.appendChild(li);
    });
  }

  function render(data) {
    const buckets = data.buckets || {};
    renderBucket('macro-inflation', buckets.inflation || FALLBACK.buckets.inflation);
    renderBucket('macro-growth', buckets.growth || FALLBACK.buckets.growth);
    renderBucket('macro-commodities', buckets.commodities || FALLBACK.buckets.commodities);
    renderBucket('macro-geopolitics', buckets.geopolitics || FALLBACK.buckets.geopolitics);

    const container = document.getElementById('macro-trends');
    const timestampNode = container ? document.querySelector('.macro-updated') : null;
    if (timestampNode) {
      const updated = data.updated || FALLBACK.updated;
      timestampNode.textContent = 'Updated ' + new Date(updated).toLocaleString();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchTrends();
    render(data || FALLBACK);
  });
})();
