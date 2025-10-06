// static/js/macro-insights.js
(function () {
  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList || []);
  }

  function closeItem(item) {
    if (!item) return;
    item.setAttribute('data-state', 'summary');
    const openBtn = item.querySelector('.macro-insight-open');
    const pane = item.querySelector('.macro-pane-insight');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    if (pane) pane.setAttribute('aria-hidden', 'true');
  }

  function openItem(item, items) {
    if (!item) return;
    (items || []).forEach((other) => {
      if (other !== item) closeItem(other);
    });
    item.setAttribute('data-state', 'insight');
    const openBtn = item.querySelector('.macro-insight-open');
    const pane = item.querySelector('.macro-pane-insight');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    if (pane) pane.setAttribute('aria-hidden', 'false');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const items = toArray(document.querySelectorAll('.macro-detail-item[data-has-insight="true"]'));
    if (!items.length) return;

    items.forEach((item) => {
      const openBtn = item.querySelector('.macro-insight-open');
      const closeBtn = item.querySelector('.macro-insight-close');
      const pane = item.querySelector('.macro-pane-insight');

      if (pane) pane.setAttribute('aria-hidden', 'true');

      if (openBtn) {
        openBtn.addEventListener('click', () => {
          openItem(item, items);
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          closeItem(item);
          const openTrigger = item.querySelector('.macro-insight-open');
          if (openTrigger) openTrigger.focus();
        });
      }

      item.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && item.getAttribute('data-state') === 'insight') {
          closeItem(item);
          const openTrigger = item.querySelector('.macro-insight-open');
          if (openTrigger) openTrigger.focus();
        }
      });
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target) return;
      const openBtn = target.closest('.macro-insight-open');
      const closeBtn = target.closest('.macro-insight-close');
      if (openBtn || closeBtn) return; // handled already
      const insightItem = target.closest('.macro-detail-item[data-has-insight="true"]');
      if (!insightItem) {
        items.forEach((item) => {
          if (item.getAttribute('data-state') === 'insight') {
            closeItem(item);
          }
        });
      }
    });
  });
})();
