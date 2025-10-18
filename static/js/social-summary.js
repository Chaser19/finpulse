// static/js/social-summary.js
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const state = {
    payload: null,
    selectedSymbol: null,
  };

  const numberFormatter = new Intl.NumberFormat('en-US');

  const tvMountTimers = new Map();

  async function jget(url) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      return await r.json();
    } catch (err) {
      console.error('[social] fetch failed', err);
      return null;
    }
  }

  function makeBar(summary) {
    const totalPosts = Number(summary.posts || 0);
    const bullPosts = Number(summary.bullish_posts || 0);
    const bearPosts = Number(summary.bearish_posts || 0);
    const neutralPosts = Number(
      summary.neutral_posts ?? Math.max(0, totalPosts - (bullPosts + bearPosts))
    );

    const denominator = Math.max(1, totalPosts || bullPosts + bearPosts + neutralPosts);
    const bullPct = Math.round((bullPosts / denominator) * 100);
    const bearPct = Math.round((bearPosts / denominator) * 100);
    let neutralPct = 100 - bullPct - bearPct;
    if (neutralPct < 0) neutralPct = 0;

    const wrap = document.createElement('div');
    wrap.className = 'sentiment-bar';

    const segments = [
      { cls: 'bull', pct: bullPct },
      { cls: 'neutral', pct: neutralPct },
      { cls: 'bear', pct: bearPct },
    ];

    segments.forEach((seg) => {
      if (seg.pct <= 0) return;
      const node = document.createElement('div');
      node.className = `sentiment-fill ${seg.cls}`;
      node.style.width = `${seg.pct}%`;
      wrap.appendChild(node);
    });

    return {
      wrap,
      bullPct,
      bearPct,
      neutralPct,
      total: Math.max(denominator, totalPosts),
      bullPosts,
      bearPosts,
      neutralPosts,
    };
  }

  function formatNumber(value, digits = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return Number(value).toFixed(digits);
  }

  function formatInteger(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return numberFormatter.format(Math.round(Number(value)));
  }

  function formatPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(0)}%`;
  }

  function formatChange(changePct, changeAbs) {
    const pct = Number(changePct);
    const abs = Number(changeAbs);
    if (!Number.isFinite(pct) || !Number.isFinite(abs)) return '—';
    const sign = pct > 0 ? '+' : pct < 0 ? '' : '';
    return `${sign}${pct.toFixed(2)}% (${sign}${abs.toFixed(2)})`;
  }

  function describeResolution(resolution) {
    if (!resolution) return null;
    const num = Number(resolution);
    if (Number.isFinite(num)) {
      return `${Math.max(1, Math.round(num))}m`;
    }
    return String(resolution).toUpperCase();
  }

  function buildPriceChart(history) {
    if (!history || history.length < 2) return null;

    const width = 360;
    const height = 160;
    const paddingX = 16;
    const paddingY = 18;
    const step = (width - paddingX * 2) / (history.length - 1);

    const closes = history.map((pt) => Number(pt.close ?? pt.price ?? pt.value ?? 0));
    if (closes.some((v) => !Number.isFinite(v))) return null;

    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const range = maxClose - minClose || 1;

    const toY = (value) => {
      const ratio = (value - minClose) / range;
      return paddingY + (1 - ratio) * (height - paddingY * 2);
    };

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('price-chart-svg');

    const baseline = document.createElementNS(SVG_NS, 'line');
    baseline.setAttribute('x1', String(paddingX));
    baseline.setAttribute('y1', String(toY(closes[0])));
    baseline.setAttribute('x2', String(width - paddingX));
    baseline.setAttribute('y2', String(toY(closes[0])));
    baseline.setAttribute('class', 'price-chart-baseline');
    svg.appendChild(baseline);

    const path = document.createElementNS(SVG_NS, 'path');
    let d = '';
    closes.forEach((val, idx) => {
      const x = paddingX + idx * step;
      const y = toY(val);
      d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    path.setAttribute('d', d);
    path.setAttribute('class', 'price-chart-line');
    if (closes[closes.length - 1] >= closes[0]) {
      path.classList.add('up');
    } else {
      path.classList.add('down');
    }
    svg.appendChild(path);

    return svg;
  }

  function sanitizeId(sym) {
    return String(sym || 'symbol').replace(/[^A-Za-z0-9_-]+/g, '_');
  }

  function mountTradingViewChart(container, symbol) {
    if (!container || !symbol) return false;
    const baseId = sanitizeId(symbol);
    const containerId = `${baseId}-tv`;
    container.id = containerId;

    const mount = () => {
      container.innerHTML = `<div id="${containerId}-inner" class="price-chart-tv"></div>`;
      try {
        // eslint-disable-next-line no-new
        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: '30',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          hide_top_toolbar: true,
          hide_legend: true,
          withdateranges: false,
          container_id: `${containerId}-inner`,
          studies: [],
        });
      } catch (err) {
        console.error('[social] TradingView mount failed', err);
        container.innerHTML = '';
      }
    };

    if (window.TradingView && typeof window.TradingView.widget === 'function') {
      mount();
      return true;
    }

    if (tvMountTimers.has(containerId)) return false;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.TradingView && typeof window.TradingView.widget === 'function') {
        clearInterval(timer);
        tvMountTimers.delete(containerId);
        mount();
      } else if (attempts > 50) {
        clearInterval(timer);
        tvMountTimers.delete(containerId);
      }
    }, 100);
    tvMountTimers.set(containerId, timer);
    return false;
  }

  function buildSparkline(history) {
    if (!history || history.length < 2) return null;
    const width = 240;
    const height = 80;
    const paddingX = 10;
    const paddingY = 12;
    const step = (width - paddingX * 2) / (history.length - 1);

    const nets = history.map((h) => Number(h.net_score || 0));
    const vols = history.map((h) => Number(h.posts || 0));

    const netMin = Math.min(...nets);
    const netMax = Math.max(...nets);
    const volMin = Math.min(...vols);
    const volMax = Math.max(...vols);

    const toY = (val, min, max) => {
      if (max === min) return height / 2;
      const ratio = (val - min) / (max - min);
      return paddingY + (1 - ratio) * (height - paddingY * 2);
    };

    const buildPath = (values, min, max) => {
      let d = '';
      values.forEach((val, idx) => {
        const x = paddingX + idx * step;
        const y = toY(val, min, max);
        d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });
      return d;
    };

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('sparkline');

    const baseline = document.createElementNS(SVG_NS, 'line');
    baseline.setAttribute('x1', String(paddingX));
    baseline.setAttribute('y1', String(height - paddingY));
    baseline.setAttribute('x2', String(width - paddingX));
    baseline.setAttribute('y2', String(height - paddingY));
    baseline.setAttribute('class', 'sparkline-baseline');
    svg.appendChild(baseline);

    const netPath = document.createElementNS(SVG_NS, 'path');
    netPath.setAttribute('d', buildPath(nets, netMin, netMax));
    netPath.setAttribute('class', 'sparkline-line net-line');
    svg.appendChild(netPath);

    const volPath = document.createElementNS(SVG_NS, 'path');
    volPath.setAttribute('d', buildPath(vols, volMin, volMax));
    volPath.setAttribute('class', 'sparkline-line volume-line');
    svg.appendChild(volPath);

    return svg;
  }

  function renderTopPosts(container, posts) {
    if (!container) return;
    const list = container.querySelector('.top-posts-list');
    if (!list) return;
    list.innerHTML = '';
    if (!posts || !posts.length) {
      container.classList.add('d-none');
      return;
    }
    container.classList.remove('d-none');
    posts.slice(0, 5).forEach((post) => {
      const snippet = (post.text || '').replace(/\s+/g, ' ').trim();
      const shortText = snippet.length > 160 ? `${snippet.slice(0, 160)}…` : snippet;
      const sentimentClass =
        post.sentiment === 'bullish' ? 'text-success' : post.sentiment === 'bearish' ? 'text-danger' : 'text-muted';
      const weightLabel = post.weight !== undefined && post.weight !== null
        ? `${post.weight >= 0 ? '+' : ''}${Number(post.weight).toFixed(2)}`
        : '';
      const engagement = [];
      if (post.like_count != null) engagement.push(`❤ ${post.like_count}`);
      if (post.repost_count != null) engagement.push(`🔁 ${post.repost_count}`);

      const li = document.createElement('li');
      li.className = 'top-post-item';
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <a href="${post.url || '#'}" target="_blank" rel="noopener" class="top-post-link">
              ${shortText || '(no text)'}
            </a>
            <div class="top-post-meta text-muted small">
              @${post.author || 'unknown'} • ${(post.engagement_level || 'low').toUpperCase()} • ${engagement.join(' · ')}
            </div>
          </div>
          <div class="fw-semibold ${sentimentClass}">${weightLabel}</div>
        </div>
      `;
      list.appendChild(li);
    });
  }

  function renderSymbolDetail(sym) {
    const detailRoot = document.getElementById('sentiment-detail');
    const empty = document.getElementById('sentiment-empty');
    if (!detailRoot) return;
    detailRoot.innerHTML = '';

    const payload = state.payload;
    const symbolData = payload?.symbols?.[sym];
    if (!payload || !sym || !symbolData) {
      empty?.classList.remove('d-none');
      return;
    }

    empty?.classList.add('d-none');

    const summary = symbolData.summary || {};
    const price = symbolData.price || {};
    const history = symbolData.history || payload.history?.[sym] || [];
    const topPosts = summary.top_posts || [];
    let priceHistory = Array.isArray(price.history) ? price.history : [];
    if (!priceHistory.length && Array.isArray(history)) {
      priceHistory = history
        .map((entry) => ({
          close: entry.close,
          time: entry.timestamp || entry.time,
        }))
        .filter((pt) => Number.isFinite(Number(pt.close)));
    }

    const metrics = makeBar(summary);
    const changePct = price.change_pct;
    const changeAbs = price.change_abs;
    const changeClass = changePct > 0 ? 'text-success' : changePct < 0 ? 'text-danger' : 'text-muted';
    const breakdown = summary.engagement_breakdown || {};

    const card = document.createElement('div');
    card.className = 'card shadow-sm social-card social-detail-card';
    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <div class="symbol-title">${sym}</div>
            <div class="price-line">
              $${formatNumber(price.close)} <span class="${changeClass}">${formatChange(changePct, changeAbs)}</span>
            </div>
          </div>
          <div class="text-end">
            <div class="net-score-value">${formatNumber(summary.net_score, 2)}</div>
            <div class="text-muted small">Net Score</div>
          </div>
        </div>

        <div class="price-chart mt-3">
          <div class="price-chart-holder"></div>
          <div class="price-chart-meta text-muted small mt-2"></div>
        </div>

        <div class="mt-4 sentiment-section">
          <h6 class="text-muted fw-semibold mb-2">Sentiment Breakdown</h6>
          <div class="sentiment-bar-wrap"></div>
          <div class="text-muted small mt-2">
            Bullish ${metrics.bullPct}% (${metrics.bullPosts}) · Neutral ${metrics.neutralPct}% (${metrics.neutralPosts}) · Bearish ${metrics.bearPct}% (${metrics.bearPosts})
          </div>
        </div>

        <div class="engagement-breakdown mt-4 d-flex gap-2 flex-wrap">
          <span class="badge badge-tier-high">High ${breakdown.high ?? 0}</span>
          <span class="badge badge-tier-medium">Med ${breakdown.medium ?? 0}</span>
          <span class="badge badge-tier-low">Low ${breakdown.low ?? 0}</span>
          <span class="badge badge-tier-total">Posts ${metrics.total}</span>
        </div>

        <div class="sparkline-container mt-4">
          <div class="sparkline-holder"></div>
          <div class="sparkline-legend text-muted small"></div>
        </div>

        <div class="top-posts mt-4">
          <h6 class="text-muted fw-semibold mb-2">Top Posts</h6>
          <ul class="list-unstyled mb-0 top-posts-list"></ul>
        </div>
      </div>
    `;

    card.querySelector('.sentiment-bar-wrap')?.appendChild(metrics.wrap);

    const chartHolder = card.querySelector('.price-chart-holder');
    const chartWrap = card.querySelector('.price-chart');
    const priceChart = buildPriceChart(priceHistory);
    let chartMode = null;
    if (priceChart && chartHolder) {
      chartHolder.innerHTML = '';
      chartHolder.appendChild(priceChart);
      chartMode = 'inline';
    } else if (chartHolder && price.tradingview_symbol) {
      chartHolder.innerHTML = '';
      mountTradingViewChart(chartHolder, price.tradingview_symbol);
      chartMode = 'tradingview';
    }
    if (!chartMode) {
      chartWrap?.classList.add('d-none');
    } else {
      chartWrap?.classList.remove('d-none');
    }

    const chartMeta = card.querySelector('.price-chart-meta');
    if (chartMeta) {
      if (!chartMode) {
        chartMeta.textContent = '';
      } else {
        const parts = [];
        const resolution = describeResolution(price.history_resolution);
        const lookback = price.history_lookback_hours;
        const updatedAt = price.timestamp ? new Date(Number(price.timestamp) * 1000) : null;
        if (resolution) parts.push(`${resolution} bars`);
        if (Number.isFinite(Number(lookback)) && lookback) parts.push(`~${lookback}h range`);
        if (updatedAt && !Number.isNaN(updatedAt.getTime())) {
          parts.push(`Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }
        if (chartMode === 'inline') {
          parts.push('Finnhub');
        } else if (chartMode === 'tradingview') {
          parts.push('TradingView');
        }
        chartMeta.textContent = parts.join(' • ');
      }
    }

    const sparkHolder = card.querySelector('.sparkline-holder');
    const spark = buildSparkline(history);
    if (spark) {
      sparkHolder?.appendChild(spark);
    } else {
      card.querySelector('.sparkline-container')?.classList.add('d-none');
    }

    const legend = card.querySelector('.sparkline-legend');
    if (legend) {
      legend.innerHTML = `
        <span class="legend-dot net"></span> Net Score 
        <span class="legend-dot volume"></span> Post Volume
      `;
    }

    renderTopPosts(card.querySelector('.top-posts'), topPosts);
    detailRoot.appendChild(card);
  }

  function setActiveSymbol(sym) {
    state.selectedSymbol = sym;
    const listRoot = document.getElementById('sentiment-list');
    if (listRoot) {
      listRoot.querySelectorAll('.social-symbol-item').forEach((node) => {
        node.classList.toggle('active', node.dataset.symbol === sym);
      });
    }
    renderSymbolDetail(sym);
  }

  function renderMetrics(payload) {
    const metricSymbols = document.getElementById('metric-symbols');
    const metricPosts = document.getElementById('metric-posts');
    const metricBullish = document.getElementById('metric-bullish');
    const metricNetScore = document.getElementById('metric-net-score');

    if (!payload || !payload.symbols) {
      if (metricSymbols) metricSymbols.textContent = '—';
      if (metricPosts) metricPosts.textContent = '—';
      if (metricBullish) metricBullish.textContent = '—';
      if (metricNetScore) metricNetScore.textContent = '—';
      return;
    }

    const entries = Object.values(payload.symbols);
    const totalSymbols = entries.length;
    let totalPosts = 0;
    let totalBullish = 0;
    let netScoreSum = 0;
    let netScoreCount = 0;

    entries.forEach((entry) => {
      const summary = entry?.summary || {};
      const posts = Number(summary.posts ?? 0);
      totalPosts += Number.isFinite(posts) ? posts : 0;
      const bullPosts = Number(summary.bullish_posts ?? 0);
      totalBullish += Number.isFinite(bullPosts) ? bullPosts : 0;
      const netScore = Number(summary.net_score);
      if (Number.isFinite(netScore)) {
        netScoreSum += netScore;
        netScoreCount += 1;
      }
    });

    const avgNet = netScoreCount ? netScoreSum / netScoreCount : null;
    const bullShare = totalPosts ? (totalBullish / totalPosts) * 100 : null;

    if (metricSymbols) metricSymbols.textContent = formatInteger(totalSymbols);
    if (metricPosts) metricPosts.textContent = formatInteger(totalPosts);
    if (metricBullish) metricBullish.textContent = bullShare === null ? '—' : formatPercent(bullShare);
    if (metricNetScore) metricNetScore.textContent = avgNet === null ? '—' : formatNumber(avgNet, 2);
  }

  function renderList(payload) {
    const listRoot = document.getElementById('sentiment-list');
    const empty = document.getElementById('sentiment-empty');
    const count = document.getElementById('sentiment-list-count');
    const detailRoot = document.getElementById('sentiment-detail');
    if (!listRoot || !detailRoot) return;

    listRoot.innerHTML = '';
    detailRoot.innerHTML = '';
    if (count) count.textContent = '';

    if (!payload) {
      empty?.classList.remove('d-none');
      state.payload = null;
      state.selectedSymbol = null;
      renderMetrics(null);
      return;
    }

    const symbols = payload.symbols || {};
    const entries = Object.entries(symbols);
    state.payload = payload;

    if (!entries.length) {
      empty?.classList.remove('d-none');
      state.selectedSymbol = null;
      renderMetrics(null);
      return;
    }

    renderMetrics(payload);

    empty?.classList.add('d-none');

    entries.sort((a, b) => (b[1]?.summary?.net_score || 0) - (a[1]?.summary?.net_score || 0));

    if (!state.selectedSymbol || !symbols[state.selectedSymbol]) {
      state.selectedSymbol = entries[0][0];
    }

    if (count) {
      const label = entries.length === 1 ? 'symbol' : 'symbols';
      count.textContent = `${entries.length} ${label}`;
    }

    const fragment = document.createDocumentFragment();
    entries.forEach(([sym, data]) => {
      const summary = data.summary || {};
      const price = data.price || {};
      const changePct = price.change_pct;
      const changeAbs = price.change_abs;
      const changeClass = Number(changePct) > 0 ? 'text-success' : Number(changePct) < 0 ? 'text-danger' : 'text-muted';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'social-symbol-item';
      btn.dataset.symbol = sym;
      btn.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="symbol-title mb-1">${sym}</div>
            <div class="text-muted small">Net ${formatNumber(summary.net_score, 2)}</div>
          </div>
          <div class="text-end">
            <div class="price-line">
              $${formatNumber(price.close)} <span class="${changeClass}">${formatChange(changePct, changeAbs)}</span>
            </div>
            <div class="text-muted small">Posts ${summary.posts ?? '—'}</div>
          </div>
        </div>
      `;
      btn.addEventListener('click', () => {
        if (state.selectedSymbol === sym) return;
        setActiveSymbol(sym);
      });
      fragment.appendChild(btn);
    });

    listRoot.appendChild(fragment);
    setActiveSymbol(state.selectedSymbol);
  }

  async function load() {
    const data = await jget('/api/social/summary');
    renderList(data || {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refresh-sentiment')?.addEventListener('click', (e) => {
      e.preventDefault();
      load();
    });
    load();
  });
})();
