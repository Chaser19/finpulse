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

  function highlightMetric(metricId) {
    const metric = document.getElementById(metricId);
    if (!metric) return;
    metric.classList.add('macro-metric-highlight');
    metric.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      metric.classList.remove('macro-metric-highlight');
    }, 1600);
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
    const tabButtons = Array.from(document.querySelectorAll('[data-bs-toggle="tab"][data-category]'));
    if (!tabButtons.length) return;

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
