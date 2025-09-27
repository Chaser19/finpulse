// static/js/social-summary.js
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

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

  function formatChange(changePct, changeAbs) {
    const pct = Number(changePct ?? 0);
    const abs = Number(changeAbs ?? 0);
    const sign = pct > 0 ? '+' : pct < 0 ? '' : '';
    return `${sign}${pct.toFixed(2)}% (${sign}${abs.toFixed(2)})`;
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

  function renderList(payload) {
    const root = document.getElementById('sentiment-list');
    const empty = document.getElementById('sentiment-empty');
    if (!root || !payload) return;
    root.innerHTML = '';

    const symbols = payload.symbols || {};
    const entries = Object.entries(symbols);
    if (!entries.length) {
      empty?.classList.remove('d-none');
      return;
    }
    empty?.classList.add('d-none');

    entries.sort((a, b) => (b[1]?.summary?.net_score || 0) - (a[1]?.summary?.net_score || 0));

    entries.forEach(([sym, data]) => {
      const summary = data.summary || {};
      const price = data.price || {};
      const history = data.history || payload.history?.[sym] || [];
      const topPosts = summary.top_posts || [];

      const metrics = makeBar(summary);
      const changePct = price.change_pct;
      const changeAbs = price.change_abs;
      const changeClass = changePct > 0 ? 'text-success' : changePct < 0 ? 'text-danger' : 'text-muted';
      const breakdown = summary.engagement_breakdown || {};

      const col = document.createElement('div');
      col.className = 'col-12 col-xl-4';
      col.innerHTML = `
        <div class="card shadow-sm h-100 social-card">
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

            <div class="mt-3 sentiment-section">
              <div class="sentiment-bar-wrap"></div>
              <div class="text-muted small mt-1">
                Bullish ${metrics.bullPct}% (${metrics.bullPosts}) · Neutral ${metrics.neutralPct}% (${metrics.neutralPosts}) · Bearish ${metrics.bearPct}% (${metrics.bearPosts})
              </div>
            </div>

            <div class="engagement-breakdown mt-3 d-flex gap-2 flex-wrap">
              <span class="badge badge-tier-high">High ${breakdown.high ?? 0}</span>
              <span class="badge badge-tier-medium">Med ${breakdown.medium ?? 0}</span>
              <span class="badge badge-tier-low">Low ${breakdown.low ?? 0}</span>
              <span class="badge badge-tier-total">Posts ${metrics.total}</span>
            </div>

            <div class="sparkline-container mt-3">
              <div class="sparkline-holder"></div>
              <div class="sparkline-legend text-muted small">Net Score • Posts</div>
            </div>

            <div class="top-posts mt-4">
              <h6 class="text-muted fw-semibold mb-2">Top Posts</h6>
              <ul class="list-unstyled mb-0 top-posts-list"></ul>
            </div>
          </div>
        </div>
      `;

      col.querySelector('.sentiment-bar-wrap')?.appendChild(metrics.wrap);

      const sparkHolder = col.querySelector('.sparkline-holder');
      const spark = buildSparkline(history);
      if (spark) {
        sparkHolder?.appendChild(spark);
      } else {
        col.querySelector('.sparkline-container')?.classList.add('d-none');
      }

      const legend = col.querySelector('.sparkline-legend');
      if (legend) {
        legend.innerHTML = `
          <span class="legend-dot net"></span> Net Score 
          <span class="legend-dot volume"></span> Post Volume
        `;
      }

      renderTopPosts(col.querySelector('.top-posts'), topPosts);
      root.appendChild(col);
    });
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
