// static/js/macro-insights.js
(function () {
  let suppressHashUpdate = false;

  function activateTab(categoryId) {
    if (typeof bootstrap === 'undefined' || !categoryId) return null;
    const trigger = document.querySelector(`[data-bs-toggle="tab"][data-category="${CSS.escape(categoryId)}"]`);
    if (!trigger) return null;
    const tab = bootstrap.Tab.getOrCreateInstance(trigger);
    tab.show();
    return trigger;
  }

  function initInsightStream(container) {
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.macro-metric-card'));
    const railInner = container.querySelector('.macro-stream-rail-inner');
    if (!cards.length || !railInner) return;

    let activeCard = cards.find((card) => card.classList.contains('is-active')) || cards[0];

    const renderDetail = (card, options = {}) => {
      if (!card) return;
      const { skipHashUpdate = false, force = false } = options;
      if (!force && card === activeCard) return;

      activeCard = card;
      cards.forEach((node) => {
        const isActive = node === card;
        node.classList.toggle('is-active', isActive);
        node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      railInner.innerHTML = '';
      const template = card.querySelector('template.macro-stream-detail-template');
      if (template && template.content) {
        const fragment = template.content.cloneNode(true);
        railInner.appendChild(fragment);
        railInner.scrollTop = 0;
        document.dispatchEvent(new CustomEvent('macro:charts:refresh', { detail: { root: railInner } }));
      } else {
        const fallback = document.createElement('div');
        fallback.className = 'macro-stream-placeholder';
        fallback.innerHTML = '<p class="macro-stream-placeholder-copy">Detail unavailable for this signal.</p>';
        railInner.appendChild(fallback);
      }

      container.setAttribute('data-active-metric', card.id || '');

      if (!skipHashUpdate) {
        const metricId = card.getAttribute('id');
        if (metricId) {
          history.replaceState(null, '', `#${metricId}`);
        }
      }
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => renderDetail(card));
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        renderDetail(card);
      });
      card.addEventListener('macro:activate', (event) => {
        const detail = event.detail || {};
        renderDetail(card, {
          force: detail.force !== undefined ? detail.force : true,
          skipHashUpdate: detail.skipHashUpdate !== undefined ? detail.skipHashUpdate : true,
        });
      });
    });

    renderDetail(activeCard, { force: true, skipHashUpdate: true });
  }

  function highlightMetric(metricId) {
    const metric = document.getElementById(metricId);
    if (!metric) return;
    metric.dispatchEvent(new CustomEvent('macro:activate', {
      bubbles: true,
      detail: { force: true, skipHashUpdate: true },
    }));
    metric.classList.add('macro-metric-highlight');
    metric.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => metric.classList.remove('macro-metric-highlight'), 1600);
  }

  function handleHashChange() {
    const rawHash = window.location.hash || '';
    const hash = rawHash.replace(/^#/, '');
    if (!hash) return;

    const metric = document.getElementById(hash);
    if (metric) {
      const category = metric.getAttribute('data-category') || hash.split('-')[0];
      suppressHashUpdate = true;
      const trigger = activateTab(category);
      if (trigger) {
        const once = () => {
          highlightMetric(hash);
          history.replaceState(null, '', `#${hash}`);
          trigger.removeEventListener('shown.bs.tab', once);
        };
        trigger.addEventListener('shown.bs.tab', once);
      } else {
        highlightMetric(hash);
        history.replaceState(null, '', `#${hash}`);
        suppressHashUpdate = false;
      }
      return;
    }

    activateTab(hash);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof bootstrap === 'undefined') return;

    const streams = Array.from(document.querySelectorAll('.macro-insight-stream'));
    streams.forEach(initInsightStream);

    const tabButtons = Array.from(document.querySelectorAll('[data-bs-toggle="tab"][data-category]'));
    tabButtons.forEach((button) => {
      button.addEventListener('shown.bs.tab', () => {
        if (suppressHashUpdate) {
          suppressHashUpdate = false;
          return;
        }
        const category = button.getAttribute('data-category');
        if (!category) return;
        history.replaceState(null, '', `#${category}`);
      });
    });

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
  });
})();
