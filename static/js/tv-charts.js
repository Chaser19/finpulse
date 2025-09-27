// static/js/tv-charts.js
(function () {
  function mountTV(containerId, symbol) {
    const host = document.getElementById(containerId);
    if (!host) return;
    if (!window.TradingView || !window.TradingView.widget) {
      console.error("[tv] TradingView lib not loaded");
      return;
    }
    host.innerHTML = '<div id="' + containerId + '-inner" style="width:100%;height:100%"></div>';
    new TradingView.widget({
      autosize: true,
      symbol,                  // e.g. "AMEX:SPY", "NASDAQ:QQQ", "AMEX:DIA"
      interval: "60",          // "D" for daily if preferred
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: false,
      hide_legend: true,
      withdateranges: true,
      container_id: containerId + "-inner",
      studies: [],
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    mountTV("chart-spx", "AMEX:SPY");
    mountTV("chart-ndx", "NASDAQ:QQQ");
    mountTV("chart-dji", "AMEX:DIA");
  });
})();
