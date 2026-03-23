import { missionFrameworkStepIcons, missionFrameworkSteps, missionMarketSegmentIcons, missionMarketSegments } from "./mission-content.js";

const renderFrameworkRail = (root) => {
  const rail = root.querySelector("[data-mission-framework-rail]");
  if (!rail) {
    return [];
  }

  rail.innerHTML = missionFrameworkSteps
    .map(
      (step, index) => `
        <button
          type="button"
          class="mission-framework-step${index === 0 ? " is-active" : ""}"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-framework-step="${step.id}"
        >
          <span class="mission-framework-step-index" aria-hidden="true">
            ${missionFrameworkStepIcons[step.id] || missionFrameworkStepIcons.focus}
          </span>
          <span class="mission-framework-step-copy">
            <strong>${step.tabTitle}</strong>
            <span>${step.tabSummary}</span>
          </span>
        </button>
      `
    )
    .join("");

  return Array.from(rail.querySelectorAll(".mission-framework-step[data-framework-step]"));
};

const renderMarketRail = (root) => {
  const rail = root.querySelector("[data-mission-market-rail]");
  if (!rail) {
    return [];
  }

  rail.innerHTML = missionMarketSegments
    .map(
      (segment, index) => `
        <button
          type="button"
          class="mission-market-step${index === 0 ? " is-active" : ""}"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-market-segment-step="${segment.id}"
        >
          <span class="mission-market-step-index" aria-hidden="true">
            ${missionMarketSegmentIcons[segment.id] || missionMarketSegmentIcons.b2c}
          </span>
          <span class="mission-market-step-copy">
            <strong>${segment.kicker}</strong>
            <span>${segment.audience}</span>
          </span>
        </button>
      `
    )
    .join("");

  return Array.from(rail.querySelectorAll(".mission-market-step[data-market-segment-step]"));
};

const resetAnimatedInlineStyles = (elements) => {
  elements.filter(Boolean).forEach((element) => {
    element.style.opacity = "";
    element.style.transform = "";
  });
};

export const initMissionScrollSections = async (root) => {
  if (!root) {
    return () => {};
  }

  const html = document.documentElement;
  const body = document.body;
  const stages = Array.from(root.querySelectorAll(".mission-scroll-stage"));
  const sectionNavButtons = Array.from(root.querySelectorAll(".mission-section-dot[data-section-nav]"));
  if (!stages.length) {
    return () => {};
  }

  html.classList.add("mission-scroll-mode");
  body.classList.add("mission-scroll-mode");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanupFns = [];
  let stageObserver = null;

  const setActiveStage = (activeStage) => {
    stages.forEach((stage) => {
      stage.classList.toggle("is-active", stage === activeStage);
    });

    const activeSectionId = activeStage?.dataset?.scrollSection || "";
    sectionNavButtons.forEach((button) => {
      const isActive = button.dataset.sectionNav === activeSectionId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  sectionNavButtons.forEach((button) => {
    const onClick = () => {
      const targetId = button.dataset.sectionNav;
      const targetStage = root.querySelector(`[data-scroll-section="${targetId}"]`);
      if (!targetStage) {
        return;
      }

      targetStage.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center"
      });
      setActiveStage(targetStage);
    };

    button.addEventListener("click", onClick);
    cleanupFns.push(() => button.removeEventListener("click", onClick));
  });

  setActiveStage(stages[0]);

  if (typeof IntersectionObserver === "function") {
    const observedRatios = new Map();
    stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          observedRatios.set(entry.target, entry.intersectionRatio);
        });

        let bestStage = stages[0];
        let bestRatio = -1;
        stages.forEach((stage) => {
          const ratio = observedRatios.get(stage) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestStage = stage;
          }
        });

        setActiveStage(bestStage);
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: "-20% 0px -20% 0px"
      }
    );

    stages.forEach((stage) => stageObserver.observe(stage));
    cleanupFns.push(() => stageObserver?.disconnect());
  }

  const cardsSection = root.querySelector('[data-scroll-section="cards"]');
  const frameworkRailButtons = cardsSection ? renderFrameworkRail(cardsSection) : [];
  const frameworkById = new Map(missionFrameworkSteps.map((step) => [step.id, step]));
  const frameworkKickerEl = cardsSection?.querySelector("[data-mission-framework-kicker]");
  const frameworkTitleEl = cardsSection?.querySelector("[data-mission-framework-title]");
  const frameworkSummaryEl = cardsSection?.querySelector("[data-mission-framework-summary]");
  const frameworkListEl = cardsSection?.querySelector("[data-mission-framework-list]");
  const frameworkMeterFillEl = cardsSection?.querySelector("[data-mission-framework-meter]");

  let activeFrameworkStepId = missionFrameworkSteps[0]?.id || "";

  const setFrameworkState = (stepId) => {
    const step = frameworkById.get(stepId);
    if (!step) {
      return;
    }

    activeFrameworkStepId = stepId;

    frameworkRailButtons.forEach((button) => {
      const isActive = button.dataset.frameworkStep === stepId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (frameworkKickerEl) {
      frameworkKickerEl.textContent = step.kicker;
      frameworkKickerEl.style.opacity = "";
      frameworkKickerEl.style.transform = "";
    }
    if (frameworkTitleEl) {
      frameworkTitleEl.textContent = step.title;
    }
    if (frameworkSummaryEl) {
      frameworkSummaryEl.textContent = step.summary;
    }
    if (frameworkListEl) {
      frameworkListEl.innerHTML = step.items.map((item) => `<li>${item}</li>`).join("");
    }
    if (frameworkMeterFillEl) {
      frameworkMeterFillEl.style.width = `${step.meter}%`;
    }

    resetAnimatedInlineStyles([
      frameworkKickerEl,
      frameworkTitleEl,
      frameworkSummaryEl,
      frameworkListEl
    ]);
  };

  let applyFrameworkStep = (stepId) => {
    if (stepId === activeFrameworkStepId) {
      return;
    }
    setFrameworkState(stepId);
  };

  frameworkRailButtons.forEach((button) => {
    const onClick = () => {
      const stepId = button.dataset.frameworkStep;
      applyFrameworkStep(stepId);
    };

    button.addEventListener("click", onClick);
    cleanupFns.push(() => button.removeEventListener("click", onClick));
  });

  if (cardsSection && missionFrameworkSteps.length) {
    setFrameworkState(activeFrameworkStepId);
  }

  const marketSection = root.querySelector('[data-scroll-section="market"]');
  const marketRailButtons = marketSection ? renderMarketRail(marketSection) : [];
  const marketById = new Map(missionMarketSegments.map((segment) => [segment.id, segment]));
  const marketKickerEl = marketSection?.querySelector("[data-mission-market-kicker]");
  const marketTitleEl = marketSection?.querySelector("[data-mission-market-title]");
  const marketValueEl = marketSection?.querySelector("[data-mission-market-value]");
  const marketPainPointsEl = marketSection?.querySelector("[data-mission-market-pain-points]");
  const marketUseCasesEl = marketSection?.querySelector("[data-mission-market-use-cases]");

  let activeMarketSegmentId = missionMarketSegments[0]?.id || "";

  const setMarketState = (segmentId) => {
    const segment = marketById.get(segmentId);
    if (!segment) {
      return;
    }

    activeMarketSegmentId = segmentId;

    marketRailButtons.forEach((button) => {
      const isActive = button.dataset.marketSegmentStep === segmentId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (marketKickerEl) {
      marketKickerEl.textContent = segment.kicker;
      marketKickerEl.style.opacity = "";
      marketKickerEl.style.transform = "";
    }
    if (marketTitleEl) {
      marketTitleEl.textContent = segment.title;
    }
    if (marketValueEl) {
      marketValueEl.textContent = segment.value;
    }
    if (marketPainPointsEl) {
      marketPainPointsEl.innerHTML = segment.painPoints.map((item) => `<li>${item}</li>`).join("");
    }
    if (marketUseCasesEl) {
      marketUseCasesEl.innerHTML = segment.useCases.map((item) => `<li>${item}</li>`).join("");
    }

    resetAnimatedInlineStyles([
      marketKickerEl,
      marketTitleEl,
      marketValueEl,
      marketPainPointsEl,
      marketUseCasesEl
    ]);
  };

  let applyMarketSegment = (segmentId) => {
    if (segmentId === activeMarketSegmentId) {
      return;
    }
    setMarketState(segmentId);
  };

  marketRailButtons.forEach((button) => {
    const onClick = () => {
      const segmentId = button.dataset.marketSegmentStep;
      applyMarketSegment(segmentId);
    };

    button.addEventListener("click", onClick);
    cleanupFns.push(() => button.removeEventListener("click", onClick));
  });

  if (marketSection && missionMarketSegments.length) {
    setMarketState(activeMarketSegmentId);
  }

  if (!reducedMotion) {
    try {
      const { animate, onScroll, stagger } = await import("https://cdn.jsdelivr.net/npm/animejs/+esm");

      const introSection = root.querySelector('[data-scroll-section="intro"]');
      const signalsSection = root.querySelector('[data-scroll-section="signals"]');
      const timelineSection = root.querySelector('[data-scroll-section="timeline"]');
      const introTargets = [root.querySelector(".mission-title-row"), root.querySelector(".mission-core-grid")].filter(Boolean);

      if (introSection && introTargets.length) {
        animate(introTargets, {
          y: [40, 0],
          duration: 1200,
          delay: stagger(120),
          ease: "out(3)",
          autoplay: onScroll({
            target: introSection,
            enter: "top 88%",
            leave: "bottom 48%",
            sync: true
          })
        });
      }

      if (marketSection) {
        const marketTargets = [
          marketSection.querySelector(".mission-market-head"),
          marketSection.querySelector(".mission-market-rail"),
          marketSection.querySelector(".mission-market-panel")
        ].filter(Boolean);

        animate(marketTargets, {
          y: [38, 0],
          duration: 1200,
          delay: stagger(110),
          ease: "out(3)",
          autoplay: onScroll({
            target: marketSection,
            enter: "top 84%",
            leave: "bottom 34%",
            sync: true
          })
        });
      }

      if (signalsSection) {
        const engagementCard = signalsSection.querySelector('[data-scroll-item="engagement"]');
        const narrativeCard = signalsSection.querySelector('[data-scroll-item="narrative"]');

        if (engagementCard) {
          animate(engagementCard, {
            x: [-46, 0],
            y: [18, 0],
            duration: 1300,
            ease: "out(3)",
            autoplay: onScroll({
              target: signalsSection,
              enter: "top 84%",
              leave: "bottom 42%",
              sync: true
            })
          });
        }

        if (narrativeCard) {
          animate(narrativeCard, {
            x: [46, 0],
            y: [18, 0],
            duration: 1300,
            ease: "out(3)",
            autoplay: onScroll({
              target: signalsSection,
              enter: "top 84%",
              leave: "bottom 42%",
              sync: true
            })
          });
        }
      }

      if (timelineSection) {
        const timelineTargets = [
          timelineSection.querySelector(".mission-roadmap-head"),
          timelineSection.querySelector(".mission-timeline-nav"),
          timelineSection.querySelector(".mission-timeline-layout")
        ].filter(Boolean);

        animate(timelineTargets, {
          y: [54, 0],
          duration: 1400,
          delay: stagger(110),
          ease: "out(3)",
          autoplay: onScroll({
            target: timelineSection,
            enter: "top 86%",
            leave: "bottom 36%",
            sync: true
          })
        });
      }

      if (cardsSection) {
        const frameworkHead = cardsSection.querySelector(".mission-framework-head");
        const frameworkRail = cardsSection.querySelector(".mission-framework-rail");
        const frameworkPanel = cardsSection.querySelector(".mission-framework-panel");
        const frameworkStepsEls = Array.from(cardsSection.querySelectorAll(".mission-framework-step"));

        animate([frameworkHead, frameworkRail, frameworkPanel].filter(Boolean), {
          y: [30, 0],
          duration: 1000,
          delay: stagger(110),
          ease: "out(3)",
          autoplay: onScroll({
            target: cardsSection,
            enter: "top 84%",
            leave: "bottom 30%",
            sync: true
          })
        });

        if (frameworkStepsEls.length) {
          let isFrameworkAnimating = false;
          applyFrameworkStep = (stepId) => {
            if (!frameworkById.has(stepId) || stepId === activeFrameworkStepId || isFrameworkAnimating) {
              return;
            }

            const step = frameworkById.get(stepId);
            const fromWidth = frameworkMeterFillEl?.style.width || "0%";
            const toWidth = `${step.meter}%`;
            isFrameworkAnimating = true;

            setFrameworkState(stepId);

            if (frameworkMeterFillEl) {
              animate(frameworkMeterFillEl, {
                width: [fromWidth, toWidth],
                duration: 520,
                ease: "out(3)"
              });
            }

            animate(frameworkStepsEls, {
              scale: (el) => (el.dataset.frameworkStep === stepId ? 1.01 : 1),
              duration: 220,
              ease: "out(2)"
            });

            window.setTimeout(() => {
              isFrameworkAnimating = false;
            }, 240);
          };
        }
      }

      if (marketSection) {
        const marketRail = marketSection.querySelector(".mission-market-rail");
        const marketPanel = marketSection.querySelector(".mission-market-panel");
        const marketSegmentEls = Array.from(marketSection.querySelectorAll(".mission-market-step"));

        if (marketRail && marketPanel && marketSegmentEls.length) {
          let isMarketAnimating = false;
          applyMarketSegment = (segmentId) => {
            if (!marketById.has(segmentId) || segmentId === activeMarketSegmentId || isMarketAnimating) {
              return;
            }

            isMarketAnimating = true;
            setMarketState(segmentId);

            animate(marketSegmentEls, {
              scale: (el) => (el.dataset.marketSegmentStep === segmentId ? 1.01 : 1),
              duration: 220,
              ease: "out(2)"
            });

            window.setTimeout(() => {
              isMarketAnimating = false;
            }, 240);
          };
        }
      }
    } catch (error) {
      console.warn("Mission scroll section animation failed to load.", error);
    }
  }

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
    html.classList.remove("mission-scroll-mode");
    body.classList.remove("mission-scroll-mode");
    stages.forEach((stage) => stage.classList.remove("is-active"));
  };
};
