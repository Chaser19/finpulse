(() => {
  const initNewsToolbarCondense = () => {
    const toolbar = document.querySelector(".news-toolbar");
    if (!toolbar) {
      return;
    }

    const computeThresholds = () => {
      const height = toolbar.getBoundingClientRect().height;
      const collapsePoint = Math.min(360, height + 140);
      const expandPoint = Math.max(48, Math.floor(height * 0.55));
      return { collapsePoint, expandPoint };
    };

    let { collapsePoint, expandPoint } = computeThresholds();
    let condensed = false;
    let ticking = false;

    const setCondensed = (nextState) => {
      if (condensed === nextState) {
        return;
      }
      condensed = nextState;
      toolbar.classList.toggle("is-condensed", condensed);
    };

    const evaluateState = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (!condensed && scrollY > collapsePoint) {
        setCondensed(true);
      } else if (condensed && scrollY < expandPoint) {
        setCondensed(false);
      }
      ticking = false;
    };

    const requestEvaluate = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(evaluateState);
    };

    window.addEventListener("scroll", requestEvaluate, { passive: true });
    window.addEventListener("resize", () => {
      if (!condensed) {
        ({ collapsePoint, expandPoint } = computeThresholds());
      }
      requestEvaluate();
    });

    requestEvaluate();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNewsToolbarCondense);
  } else {
    initNewsToolbarCondense();
  }
})();
