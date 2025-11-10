// static/js/social-summary.js
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const state = {
    payload: null,
    selectedSymbol: null,
  };

  const numberFormatter = new Intl.NumberFormat('en-US');
  const relativeFormatter = typeof Intl.RelativeTimeFormat === 'function'
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    : null;

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

  function toMillis(value) {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') {
      if (value > 1e12) return value;
      if (value > 1e9) return value * 1000;
      return value;
    }
    if (typeof value === 'string') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        return num > 1e12 ? num : num > 1e9 ? num * 1000 : num;
      }
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  }

  function normaliseHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
      .map((entry) => {
        const ts = toMillis(entry.timestamp ?? entry.time ?? entry.ts);
        if (!Number.isFinite(ts)) return null;
        return { ...entry, __ts: ts };
      })
      .filter(Boolean)
      .sort((a, b) => a.__ts - b.__ts);
  }

  function classifyTone(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return { label: 'Unrated', className: 'tone-neutral' };
    if (value >= 35) return { label: 'High conviction bull', className: 'tone-bullish' };
    if (value >= 10) return { label: 'Bullish', className: 'tone-bullish' };
    if (value <= -35) return { label: 'High conviction bear', className: 'tone-bearish' };
    if (value <= -10) return { label: 'Bearish', className: 'tone-bearish' };
    return { label: 'Balanced', className: 'tone-neutral' };
  }

  function computeHistoryDelta(history, key) {
    if (!history || history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    const start = Number(first?.[key]);
    const end = Number(last?.[key]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return end - start;
  }

  function describePriceMeta(price) {
    if (!price) return '';
    const parts = [];
    if (price.currency) parts.push(String(price.currency).toUpperCase());
    const ts = toMillis(price.timestamp);
    if (Number.isFinite(ts)) {
      const dt = new Date(ts);
      const human = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const rel = formatRelativeTime(dt);
      parts.push(rel ? `Updated ${human} (${rel})` : `Updated ${human}`);
    }
    if (price.source) parts.push(String(price.source).toUpperCase());
    return parts.join(' • ');
  }

  function formatRelativeTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = date.getTime() - now;
    const units = [
      ['day', 86400000],
      ['hour', 3600000],
      ['minute', 60000],
    ];
    for (const [unit, ms] of units) {
      if (Math.abs(diffMs) >= ms || unit === 'minute') {
        const value = Math.round(diffMs / ms);
        if (relativeFormatter) return relativeFormatter.format(value, unit);
        return `${value < 0 ? Math.abs(value) : value} ${unit}${Math.abs(value) === 1 ? '' : 's'} ${value < 0 ? 'ago' : 'ahead'}`;
      }
    }
    return '';
  }

  function buildSymbolInsights(summary, metrics, historySeries, price) {
    const netScore = Number(summary?.net_score);
    const tone = classifyTone(netScore);
    const netDelta = computeHistoryDelta(historySeries, 'net_score');
    const postDelta = computeHistoryDelta(historySeries, 'posts');
    const posts = Number(summary?.posts);
    const bullShare = Number.isFinite(metrics?.bullPct) ? metrics.bullPct : null;
    const breakdown = summary?.engagement_breakdown || {};
    const totalPosts = metrics?.total ?? posts ?? 0;
    const highShare = totalPosts
      ? ((Number(breakdown.high ?? 0) / Number(totalPosts)) * 100)
      : null;
    const changePct = Number(price?.change_pct);
    const priceDelta = computeHistoryDelta(historySeries, 'close');

    const pulseParts = [];
    if (Number.isFinite(netScore)) {
      pulseParts.push(`Net score ${netScore >= 0 ? '+' : ''}${netScore.toFixed(1)} (${tone.label.toLowerCase()}).`);
    }
    if (Number.isFinite(netDelta) && Math.abs(netDelta) >= 1) {
      pulseParts.push(`${netDelta >= 0 ? 'Rising' : 'Fading'} ${Math.abs(netDelta).toFixed(1)} pts vs prior window.`);
    }
    if (!pulseParts.length) {
      pulseParts.push('Waiting on fresh sentiment updates.');
    }

    const flowParts = [];
    if (Number.isFinite(posts)) {
      flowParts.push(`${formatInteger(posts)} posts this capture.`);
    }
    if (Number.isFinite(bullShare)) {
      flowParts.push(`${bullShare.toFixed(0)}% bullish share.`);
    }
    if (Number.isFinite(highShare)) {
      flowParts.push(`${Math.round(highShare)}% from high-engagement accounts.`);
    }
    if (Number.isFinite(postDelta) && Math.abs(postDelta) >= 1) {
      flowParts.push(`${postDelta >= 0 ? '+' : ''}${postDelta.toFixed(0)} posts vs previous window.`);
    }
    if (!flowParts.length) {
      flowParts.push('Chatter volume standing by for new ingest.');
    }

    const priceParts = [];
    if (Number.isFinite(changePct)) {
      priceParts.push(`${changePct >= 0 ? 'Up' : 'Down'} ${Math.abs(changePct).toFixed(2)}% on the session.`);
    }
    if (Number.isFinite(priceDelta) && Math.abs(priceDelta) >= 0.1) {
      priceParts.push(`${priceDelta >= 0 ? 'Trending higher' : 'Drifting lower'} across the lookback.`);
    }
    if (!priceParts.length) {
      priceParts.push('Waiting on fresh price history.');
    }

    const engagementText = Number.isFinite(highShare)
      ? `${Math.round(highShare)}% of posts come from high-engagement accounts`
      : 'Add more handles to unlock engagement mix';

    return {
      toneLabel: tone.label,
      toneClass: tone.className,
      pulseText: pulseParts.join(' '),
      flowText: flowParts.join(' '),
      priceText: priceParts.join(' '),
      engagementText,
    };
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

  function formatSigned(value, digits = 0) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';
    const num = Number(value);
    const fixed = num.toFixed(digits);
    return num > 0 ? `+${fixed}` : fixed;
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

  function formatProviderName(source, fallback = '') {
    const raw = source || fallback;
    if (!raw) return '';
    return String(raw)
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim();
  }

  function buildPriceChart(history) {
    if (!Array.isArray(history) || history.length < 2) return null;

    const prepared = history
      .map((entry) => {
        const close = Number(entry.close ?? entry.price ?? entry.value);
        if (!Number.isFinite(close)) return null;
        const ts = toMillis(entry.time ?? entry.timestamp ?? entry.date);
        const iso = Number.isFinite(ts) ? new Date(ts).toISOString().slice(0, 10) : '';
        return { close, ts, iso };
      })
      .filter(Boolean);

    if (prepared.length < 2) return null;

    const limit = 60;
    const points = prepared.slice(-limit);
    const width = 720;
    const height = 320;
    const pad = { left: 48, right: 20, top: 24, bottom: 34 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;
    const n = points.length;

    const xScale = (idx) => {
      if (n <= 1) return pad.left;
      return pad.left + (idx * chartWidth) / (n - 1);
    };

    const closes = points.map((pt) => pt.close);
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const padY = (maxClose - minClose) * 0.08 || Math.max(1, minClose * 0.05);
    const yMin = minClose - padY;
    const yMax = maxClose + padY;
    const yScale = (val) => {
      if (yMax === yMin) return pad.top + chartHeight / 2;
      return pad.top + chartHeight - ((val - yMin) * chartHeight) / (yMax - yMin);
    };

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('price-chart-svg');

    const gridGroup = document.createElementNS(SVG_NS, 'g');
    gridGroup.classList.add('price-chart-grid');
    svg.appendChild(gridGroup);

    const axisGroup = document.createElementNS(SVG_NS, 'g');
    axisGroup.classList.add('price-chart-axes');
    svg.appendChild(axisGroup);

    const ticksGroup = document.createElementNS(SVG_NS, 'g');
    ticksGroup.classList.add('price-chart-ticks');
    svg.appendChild(ticksGroup);

    // Horizontal grid + y ticks
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = yMin + (i * (yMax - yMin)) / ySteps;
      const y = Math.round(yScale(value));
      const hLine = document.createElementNS(SVG_NS, 'line');
      hLine.setAttribute('x1', String(pad.left));
      hLine.setAttribute('x2', String(width - pad.right));
      hLine.setAttribute('y1', String(y));
      hLine.setAttribute('y2', String(y));
      hLine.classList.add('price-chart-grid-line');
      gridGroup.appendChild(hLine);

      const label = document.createElementNS(SVG_NS, 'text');
      label.classList.add('price-chart-tick');
      label.setAttribute('x', String(pad.left - 10));
      label.setAttribute('y', String(y + 4));
      label.setAttribute('text-anchor', 'end');
      label.textContent = value.toFixed(2);
      ticksGroup.appendChild(label);
    }

    // Vertical grid + x ticks
    const tickCount = Math.min(6, n);
    for (let i = 0; i < tickCount; i++) {
      const idx = tickCount === 1 ? 0 : Math.round((i * (n - 1)) / (tickCount - 1));
      const x = Math.round(xScale(idx));
      const vLine = document.createElementNS(SVG_NS, 'line');
      vLine.setAttribute('x1', String(x));
      vLine.setAttribute('x2', String(x));
      vLine.setAttribute('y1', String(pad.top));
      vLine.setAttribute('y2', String(height - pad.bottom));
      vLine.classList.add('price-chart-grid-line', 'vertical');
      gridGroup.appendChild(vLine);

      const tick = document.createElementNS(SVG_NS, 'text');
      tick.classList.add('price-chart-tick');
      tick.setAttribute('x', String(x));
      tick.setAttribute('y', String(height - pad.bottom + 18));
      tick.setAttribute('text-anchor', 'middle');
      const rawLabel = points[idx].iso || '';
      tick.textContent = rawLabel ? rawLabel.slice(5) : '';
      ticksGroup.appendChild(tick);
    }

    // Axes
    const xAxis = document.createElementNS(SVG_NS, 'line');
    xAxis.setAttribute('x1', String(pad.left));
    xAxis.setAttribute('x2', String(width - pad.right));
    xAxis.setAttribute('y1', String(height - pad.bottom));
    xAxis.setAttribute('y2', String(height - pad.bottom));
    xAxis.classList.add('price-chart-axis');
    axisGroup.appendChild(xAxis);

    const yAxis = document.createElementNS(SVG_NS, 'line');
    yAxis.setAttribute('x1', String(pad.left));
    yAxis.setAttribute('x2', String(pad.left));
    yAxis.setAttribute('y1', String(pad.top));
    yAxis.setAttribute('y2', String(height - pad.bottom));
    yAxis.classList.add('price-chart-axis');
    axisGroup.appendChild(yAxis);

    // Line path
    const path = document.createElementNS(SVG_NS, 'path');
    let d = '';
    points.forEach((pt, idx) => {
      const x = xScale(idx);
      const y = yScale(pt.close);
      d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    path.setAttribute('d', d);
    path.setAttribute('class', 'price-chart-line');
    if (points[n - 1].close >= points[0].close) {
      path.classList.add('up');
    } else {
      path.classList.add('down');
    }
    svg.appendChild(path);

    // Dots
    const dotsGroup = document.createElementNS(SVG_NS, 'g');
    dotsGroup.classList.add('price-chart-dots');
    points.forEach((pt, idx) => {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(xScale(idx)));
      dot.setAttribute('cy', String(yScale(pt.close)));
      dot.setAttribute('r', idx === n - 1 ? '3.2' : '2.2');
      dot.classList.add('price-chart-dot');
      if (idx === n - 1) dot.classList.add('latest');
      dotsGroup.appendChild(dot);
    });
    svg.appendChild(dotsGroup);

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

  function describeMomentum(nets, vols) {
    const firstNet = Number(nets[0] ?? 0);
    const lastNet = Number(nets[nets.length - 1] ?? 0);
    const netDelta = Number.isFinite(firstNet) && Number.isFinite(lastNet) ? lastNet - firstNet : 0;

    const firstVol = Number(vols[0] ?? 0);
    const lastVol = Number(vols[vols.length - 1] ?? 0);
    let volumeDeltaPct = 0;
    if (firstVol > 0 && Number.isFinite(lastVol)) {
      volumeDeltaPct = ((lastVol - firstVol) / firstVol) * 100;
    } else if (firstVol <= 0 && lastVol > 0) {
      volumeDeltaPct = 100;
    }

    const peakVolume = Math.max(...vols, 0);

    const trend = (() => {
      if (netDelta >= 8 && volumeDeltaPct >= 25) {
        return {
          title: 'Bullish swarm',
          detail: 'Net score and crowd attention climbed together.',
        };
      }
      if (netDelta >= 8 && volumeDeltaPct <= -15) {
        return {
          title: 'Quiet accumulation',
          detail: 'Conviction improved even as chatter cooled.',
        };
      }
      if (netDelta <= -8 && volumeDeltaPct >= 25) {
        return {
          title: 'Bearish pile-on',
          detail: 'Volume spiked while sentiment deteriorated.',
        };
      }
      if (netDelta <= -8 && volumeDeltaPct <= -15) {
        return {
          title: 'Exhausted fade',
          detail: 'Both attention and net score lost momentum.',
        };
      }
      if (Math.abs(netDelta) <= 4 && Math.abs(volumeDeltaPct) >= 25) {
        return {
          title: 'Volume regime shift',
          detail: 'Sentiment held steady but interest moved sharply.',
        };
      }
      return {
        title: 'Stable tape',
        detail: 'No dramatic divergence between conviction and chatter.',
      };
    })();

    const legendHtml = `
      <div class="momentum-summary">
        <strong>${trend.title}</strong>
        <span>${trend.detail}</span>
      </div>
      <div class="momentum-badges">
        <span class="momentum-chip ${netDelta >= 0 ? 'chip-up' : 'chip-down'}">Net ${formatSigned(netDelta, 1)} pts</span>
        <span class="momentum-chip ${volumeDeltaPct >= 0 ? 'chip-up' : 'chip-down'}">Volume ${formatSigned(volumeDeltaPct, 0)}%</span>
        <span class="momentum-chip chip-neutral">Peak ${formatInteger(peakVolume)} posts</span>
      </div>
    `;

    return { legendHtml };
  }

  function buildMomentumChart(history) {
    if (!history || history.length < 2) return null;
    const width = 320;
    const height = 140;
    const paddingX = 16;
    const paddingY = 18;
    const chartHeight = height - paddingY * 2;
    const step = history.length > 1 ? (width - paddingX * 2) / (history.length - 1) : 0;

    const nets = history.map((h) => Number(h.net_score ?? 0));
    const vols = history.map((h) => Math.max(0, Number(h.posts ?? 0)));
    if (!nets.length || !vols.length) return null;

    const maxVolume = Math.max(...vols, 1);
    const barWidth = Math.max(2, (width - paddingX * 2) / history.length - 2);

    const netAbsMax = Math.max(...nets.map((n) => Math.abs(Number.isFinite(n) ? n : 0)), 1);
    const toNetY = (value) => {
      const val = Number.isFinite(value) ? value : 0;
      const ratio = (val + netAbsMax) / (netAbsMax * 2);
      return paddingY + (1 - ratio) * chartHeight;
    };
    const zeroY = toNetY(0);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('sparkline');

    const zeroLine = document.createElementNS(SVG_NS, 'line');
    zeroLine.setAttribute('x1', String(paddingX));
    zeroLine.setAttribute('x2', String(width - paddingX));
    zeroLine.setAttribute('y1', String(zeroY));
    zeroLine.setAttribute('y2', String(zeroY));
    zeroLine.setAttribute('class', 'momentum-zero-line');
    svg.appendChild(zeroLine);

    const barGroup = document.createElementNS(SVG_NS, 'g');
    vols.forEach((vol, idx) => {
      const magnitude = Number.isFinite(vol) ? vol : 0;
      const barHeight = (magnitude / maxVolume) * (chartHeight * 0.7);
      const x = paddingX + idx * step - barWidth / 2;
      const y = paddingY + chartHeight - barHeight;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(barHeight));
      rect.setAttribute('class', 'momentum-volume-bar');
      rect.setAttribute('opacity', (magnitude / maxVolume) * 0.5 + 0.2);
      barGroup.appendChild(rect);
    });
    svg.appendChild(barGroup);

    const path = document.createElementNS(SVG_NS, 'path');
    let d = '';
    nets.forEach((val, idx) => {
      const x = paddingX + idx * step;
      const y = toNetY(val);
      d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    path.setAttribute('d', d);
    path.setAttribute('class', 'momentum-net-line');
    const trendUp = nets[nets.length - 1] >= nets[0];
    path.classList.add(trendUp ? 'trend-up' : 'trend-down');
    svg.appendChild(path);

    const lastCircle = document.createElementNS(SVG_NS, 'circle');
    lastCircle.setAttribute('cx', String(paddingX + (history.length - 1) * step));
    lastCircle.setAttribute('cy', String(toNetY(nets[nets.length - 1])));
    lastCircle.setAttribute('r', '3');
    lastCircle.setAttribute('class', `momentum-net-node ${trendUp ? 'trend-up' : 'trend-down'}`);
    svg.appendChild(lastCircle);

    return {
      chart: svg,
      legend: describeMomentum(nets, vols).legendHtml,
    };
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
    const historyRaw = symbolData.history || payload.history?.[sym] || [];
    const historySeries = normaliseHistory(historyRaw);
    const topPosts = summary.top_posts || [];
    const rawPriceHistory = Array.isArray(price.history) ? price.history : [];
    let priceHistory = rawPriceHistory.slice();
    if (!priceHistory.length && historySeries.length) {
      priceHistory = historySeries
        .map((entry) => {
          const close = Number(entry.close ?? entry.price ?? entry.value);
          if (!Number.isFinite(close)) return null;
          return {
            close,
            time: entry.__ts ? Math.round(entry.__ts / 1000) : undefined,
          };
        })
        .filter(Boolean);
    }

    const metrics = makeBar(summary);
    const changePct = price.change_pct;
    const changeAbs = price.change_abs;
    const changeClass = changePct > 0 ? 'text-success' : changePct < 0 ? 'text-danger' : 'text-muted';
    const breakdown = summary.engagement_breakdown || {};
    const insights = buildSymbolInsights(summary, metrics, historySeries, price);
    const exchangeLabel = String(price.exchange || 'Equity').toUpperCase();
    const companyLine = price.company_name || price.tradingview_symbol || sym;
    const priceMeta = describePriceMeta(price);

    const card = document.createElement('div');
    card.className = 'card shadow-sm social-card social-detail-card';
    card.innerHTML = `
      <div class="card-body">
        <div class="symbol-panel">
          <div>
            <span class="symbol-chip">${exchangeLabel}</span>
            <div class="symbol-title">${sym}</div>
            <div class="symbol-subtitle">${companyLine}</div>
          </div>
          <div class="symbol-price-block">
            <div class="price-line">
              <span class="price-value">$${formatNumber(price.close)}</span>
            </div>
            <div class="${changeClass}">${formatChange(changePct, changeAbs)}${price.currency ? ` · ${price.currency}` : ''}</div>
            <div class="text-muted small">${priceMeta}</div>
          </div>
        </div>

        <div class="symbol-chart-grid mt-4">
          <div class="price-card">
            <div class="panel-title">Price action</div>
            <div class="price-chart mt-3">
              <div class="price-chart-holder"></div>
              <div class="price-chart-meta text-muted small mt-2"></div>
              <div class="price-chart-note text-warning small mt-1 d-none"></div>
            </div>
          </div>
          <div class="insight-stack">
            <div class="insight-chip ${insights.toneClass || 'tone-neutral'}">
              <span>${insights.toneLabel}</span>
              <strong>${formatNumber(summary.net_score, 2)}</strong>
            </div>
            <div class="insight-note">
              <h6>Sentiment pulse</h6>
              <p class="mb-0">${insights.pulseText}</p>
            </div>
            <div class="insight-note">
              <h6>Flow of chatter</h6>
              <p class="mb-0">${insights.flowText}</p>
            </div>
            <div class="insight-note">
              <h6>Price alignment</h6>
              <p class="mb-0">${insights.priceText}</p>
            </div>
          </div>
        </div>

        <div class="sentiment-engagement-grid mt-4">
          <div class="card-panel">
            <div class="panel-title">Sentiment mix</div>
            <div class="sentiment-bar-wrap mt-3"></div>
            <div class="text-muted small mt-2">
              Bullish ${metrics.bullPct}% (${metrics.bullPosts}) · Neutral ${metrics.neutralPct}% (${metrics.neutralPosts}) · Bearish ${metrics.bearPct}% (${metrics.bearPosts})
            </div>
          </div>
          <div class="card-panel">
            <div class="panel-title">Engagement tiers</div>
            <div class="engagement-breakdown mt-3 d-flex gap-2 flex-wrap">
              <span class="badge badge-tier-high">High ${breakdown.high ?? 0}</span>
              <span class="badge badge-tier-medium">Med ${breakdown.medium ?? 0}</span>
              <span class="badge badge-tier-low">Low ${breakdown.low ?? 0}</span>
              <span class="badge badge-tier-total">Posts ${metrics.total}</span>
            </div>
            <p class="text-muted small mt-2 mb-0">${insights.engagementText}</p>
          </div>
        </div>

        <div class="symbol-lower-grid mt-4">
          <div class="sparkline-container card-panel">
            <div class="panel-title">Net score vs post volume</div>
            <div class="sparkline-holder mt-3"></div>
            <div class="sparkline-legend text-muted small"></div>
          </div>
          <div class="top-posts card-panel">
            <div class="panel-title">Top posts</div>
            <ul class="list-unstyled mb-0 top-posts-list mt-3"></ul>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.sentiment-bar-wrap')?.appendChild(metrics.wrap);

    const chartHolder = card.querySelector('.price-chart-holder');
    const chartWrap = card.querySelector('.price-chart');
    let chartMode = null;
    const hasInlineHistory = priceHistory.length >= 2;
    if (chartHolder && hasInlineHistory) {
      const priceChart = buildPriceChart(priceHistory);
      if (priceChart) {
        chartHolder.innerHTML = '';
        chartHolder.appendChild(priceChart);
        chartMode = 'inline';
      }
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
    const chartNote = card.querySelector('.price-chart-note');
    if (chartMeta) {
      if (!chartMode) {
        chartMeta.textContent = '';
      } else {
        const parts = [];
        const resolution = describeResolution(price.history_resolution);
        const lookback = Number(price.history_lookback_hours);
        const ts = toMillis(price.timestamp);
        const updatedAt = Number.isFinite(ts) ? new Date(ts) : null;
        const refreshedAt = price.history_last_refreshed;
        if (chartMode === 'inline') {
          if (resolution) parts.push(`${resolution} bars`);
          if (Number.isFinite(lookback) && lookback) {
            const hoursLabel = lookback % 24 === 0 ? `${Math.round(lookback / 24)}d` : `${lookback}h`;
            parts.push(`~${hoursLabel} range`);
          }
        }
        if (updatedAt && !Number.isNaN(updatedAt.getTime())) {
          parts.push(`Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } else if (refreshedAt) {
          parts.push(`Refreshed ${refreshedAt}`);
        }
        if (chartMode === 'inline') {
          const provider = formatProviderName(price.history_source, 'Alpha Vantage');
          if (provider) parts.push(provider);
        } else if (chartMode === 'tradingview') {
          parts.push('TradingView');
        }
        chartMeta.textContent = parts.join(' • ');
      }
    }
    if (chartNote) {
      const alerts = [];
      if (price.history_error) alerts.push(price.history_error);
      if (price.history_note && price.history_note !== price.history_error) alerts.push(price.history_note);
      if (alerts.length) {
        chartNote.textContent = alerts.join(' • ');
        chartNote.classList.remove('d-none');
      } else {
        chartNote.textContent = '';
        chartNote.classList.add('d-none');
      }
    }

    const sparkSection = card.querySelector('.sparkline-container');
    const sparkHolder = card.querySelector('.sparkline-holder');
    const momentum = buildMomentumChart(historySeries);
    if (sparkHolder && momentum) {
      sparkHolder.innerHTML = '';
      sparkHolder.appendChild(momentum.chart);
      sparkSection?.classList.remove('d-none');
      const legend = card.querySelector('.sparkline-legend');
      if (legend) legend.innerHTML = momentum.legend;
    } else {
      sparkSection?.classList.add('d-none');
      const legend = card.querySelector('.sparkline-legend');
      if (legend) legend.innerHTML = '';
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
