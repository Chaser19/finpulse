const initMissionScrollSections = async () => {
  const root = document.querySelector(".mission-page");
  if (!root) {
    return;
  }

  const html = document.documentElement;
  const body = document.body;
  const stages = Array.from(root.querySelectorAll(".mission-scroll-stage"));
  const sectionNavButtons = Array.from(root.querySelectorAll(".mission-section-dot[data-section-nav]"));
  if (!stages.length) {
    return;
  }

  html.classList.add("mission-scroll-mode");
  body.classList.add("mission-scroll-mode");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    button.addEventListener("click", () => {
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
    });
  });

  setActiveStage(stages[0]);

  if (typeof IntersectionObserver === "function") {
    const observedRatios = new Map();
    const stageObserver = new IntersectionObserver(
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
  }

  const cardsSection = root.querySelector('[data-scroll-section="cards"]');
  const frameworkSteps = [
    {
      id: "focus",
      kicker: "Pillar 01",
      count: "01 / 04",
      meter: 25,
      title: "Model Development Focus",
      summary: "FinPulse structures market attention into measurable components before any predictive interpretation is attempted.",
      items: [
        "Track <strong>intensity</strong>, <strong>velocity</strong>, and <strong>persistence</strong> of market-relevant engagement.",
        "Classify engagement by <strong>asset class</strong>, <strong>macro theme</strong>, and narrative structure.",
        "Evaluate relationships with <strong>price</strong>, <strong>volatility</strong>, <strong>volume</strong>, and <strong>liquidity</strong>."
      ]
    },
    {
      id: "signal",
      kicker: "Pillar 02",
      count: "02 / 04",
      meter: 50,
      title: "Why This Signal Matters",
      summary: "Social media increasingly operates as a real-time transmission layer for macro releases, geopolitical developments, corporate events, and trader positioning.",
      items: [
        "Participation from analysts, journalists, policymakers, institutions, and retail cohorts expands narrative reach.",
        "Engagement can both <strong>reflect expectations</strong> and <strong>amplify them</strong>.",
        "Signal quality improves when narrative context is paired with market microstructure."
      ]
    },
    {
      id: "indicators",
      kicker: "Pillar 03",
      count: "03 / 04",
      meter: 75,
      title: "Structured Indicators",
      summary: "The objective is to package noisy discourse into repeatable diagnostics that can be tracked over time.",
      items: [
        "Engagement surge flags and sentiment-adjusted momentum.",
        "Narrative persistence metrics for medium-term regime tracking.",
        "Cross-asset information-sensitivity diagnostics."
      ]
    },
    {
      id: "roadmap",
      kicker: "Pillar 04",
      count: "04 / 04",
      meter: 100,
      title: "Positioning & Roadmap",
      summary: "FinPulse is currently a research-driven, non-commercial initiative prioritising rigorous data handling, transparent assumptions, and analytical discipline.",
      items: [
        "Current emphasis remains on methodological quality and repeatability.",
        "Near-term work extends the framework into macro-thematic and cross-asset monitoring.",
        "Longer-term direction targets advanced alternative-data research applications."
      ]
    }
  ];

  const frameworkById = new Map(frameworkSteps.map((step) => [step.id, step]));
  const frameworkRailButtons = cardsSection
    ? Array.from(cardsSection.querySelectorAll(".mission-framework-step[data-framework-step]"))
    : [];
  const frameworkKickerEl = cardsSection?.querySelector("#missionFrameworkKicker");
  const frameworkCountEl = cardsSection?.querySelector("#missionFrameworkCount");
  const frameworkTitleEl = cardsSection?.querySelector("#missionFrameworkTitle");
  const frameworkSummaryEl = cardsSection?.querySelector("#missionFrameworkSummary");
  const frameworkListEl = cardsSection?.querySelector("#missionFrameworkList");
  const frameworkMeterFillEl = cardsSection?.querySelector("#missionFrameworkMeterFill");

  let activeFrameworkStepId = frameworkSteps[0]?.id || "";

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
    }
    if (frameworkCountEl) {
      frameworkCountEl.textContent = step.count;
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
  };

  let applyFrameworkStep = (stepId) => {
    if (stepId === activeFrameworkStepId) {
      return;
    }
    setFrameworkState(stepId);
  };

  frameworkRailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const stepId = button.dataset.frameworkStep;
      applyFrameworkStep(stepId);
    });
  });

  if (cardsSection && frameworkSteps.length) {
    setFrameworkState(activeFrameworkStepId);
  }

  if (reducedMotion) {
    return;
  }

  try {
    const { animate, onScroll, stagger } = await import("https://cdn.jsdelivr.net/npm/animejs/+esm");

    const introSection = root.querySelector('[data-scroll-section="intro"]');
    const signalsSection = root.querySelector('[data-scroll-section="signals"]');
    const timelineSection = root.querySelector('[data-scroll-section="timeline"]');
    const introTargets = [
      root.querySelector(".mission-title-row"),
      root.querySelector(".mission-core-grid")
    ].filter(Boolean);

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
      const panelTargets = [
        frameworkKickerEl,
        frameworkCountEl,
        frameworkTitleEl,
        frameworkSummaryEl,
        frameworkListEl
      ].filter(Boolean);

      const frameworkAnimTargets = [
        frameworkHead,
        frameworkRail,
        frameworkPanel
      ]
        .filter(Boolean);

      animate(frameworkAnimTargets, {
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

      if (frameworkStepsEls.length && panelTargets.length) {
        let isFrameworkAnimating = false;
        applyFrameworkStep = (stepId) => {
          if (!frameworkById.has(stepId) || stepId === activeFrameworkStepId || isFrameworkAnimating) {
            return;
          }

          const step = frameworkById.get(stepId);
          const fromWidth = frameworkMeterFillEl?.style.width || "0%";
          const toWidth = `${step.meter}%`;
          isFrameworkAnimating = true;

          animate(panelTargets, {
            opacity: [1, 0],
            y: [0, 12],
            duration: 170,
            ease: "in(3)",
            complete: () => {
              setFrameworkState(stepId);

              animate(panelTargets, {
                opacity: [0, 1],
                y: [12, 0],
                duration: 340,
                delay: stagger(40),
                ease: "out(3)"
              });

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
              }, 360);
            }
          });
        };
      }
    }
  } catch (error) {
    console.warn("Mission scroll section animation failed to load.", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMissionScrollSections, { once: true });
} else {
  initMissionScrollSections();
}
