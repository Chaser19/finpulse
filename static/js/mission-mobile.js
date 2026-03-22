import { missionFrameworkStepIcons, missionFrameworkSteps, roadmapPhases } from "./mission-content.js";

const renderFrameworkRail = (root) => {
  const rail = root.querySelector("[data-mission-mobile-framework-rail]");
  if (!rail) {
    return [];
  }

  rail.innerHTML = missionFrameworkSteps
    .map(
      (step, index) => `
        <button
          type="button"
          class="mission-mobile-framework-tab${index === 0 ? " is-active" : ""}"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-mission-mobile-framework-step="${step.id}"
        >
          <span class="mission-mobile-framework-tab-icon" aria-hidden="true">
            ${missionFrameworkStepIcons[step.id] || missionFrameworkStepIcons.focus}
          </span>
          <span class="mission-mobile-framework-tab-copy">
            <span class="mission-mobile-framework-tab-step">${step.count}</span>
            <span class="mission-mobile-framework-tab-title">${step.tabTitle}</span>
          </span>
        </button>
      `
    )
    .join("");

  return Array.from(rail.querySelectorAll("[data-mission-mobile-framework-step]"));
};

const initFrameworkInteraction = (root) => {
  const container = root.querySelector("[data-mission-mobile-framework]");
  if (!container) {
    return;
  }

  const buttons = renderFrameworkRail(container);
  const frameworkById = new Map(missionFrameworkSteps.map((step) => [step.id, step]));
  const kickerEl = container.querySelector("[data-mission-mobile-framework-kicker]");
  const countEl = container.querySelector("[data-mission-mobile-framework-count]");
  const titleEl = container.querySelector("[data-mission-mobile-framework-title]");
  const summaryEl = container.querySelector("[data-mission-mobile-framework-summary]");
  const listEl = container.querySelector("[data-mission-mobile-framework-list]");
  const meterEl = container.querySelector("[data-mission-mobile-framework-meter]");

  const applyStep = (stepId) => {
    const step = frameworkById.get(stepId);
    if (!step) {
      return;
    }

    buttons.forEach((button) => {
      const isActive = button.dataset.missionMobileFrameworkStep === stepId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    });

    if (kickerEl) {
      kickerEl.textContent = step.kicker;
    }
    if (countEl) {
      countEl.textContent = step.count;
    }
    if (titleEl) {
      titleEl.textContent = step.title;
    }
    if (summaryEl) {
      summaryEl.textContent = step.summary;
    }
    if (listEl) {
      listEl.innerHTML = step.items.map((item) => `<li>${item}</li>`).join("");
    }
    if (meterEl) {
      meterEl.style.width = `${step.meter}%`;
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      applyStep(button.dataset.missionMobileFrameworkStep);
    });

    button.addEventListener("keydown", (event) => {
      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (index + direction + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      applyStep(buttons[nextIndex].dataset.missionMobileFrameworkStep);
    });
  });

  applyStep(missionFrameworkSteps[0]?.id || "");
};

const renderRoadmapRail = (root) => {
  const rail = root.querySelector("[data-mission-mobile-roadmap-rail]");
  if (!rail) {
    return [];
  }

  rail.innerHTML = roadmapPhases
    .map(
      (phase, index) => `
        <button
          type="button"
          class="mission-mobile-roadmap-tab${index === 0 ? " is-active" : ""}"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-mission-mobile-roadmap-phase="${phase.id}"
        >
          <span class="mission-mobile-roadmap-tab-step">${phase.navMeta}</span>
          <span class="mission-mobile-roadmap-tab-title">${phase.navTitle}</span>
        </button>
      `
    )
    .join("");

  return Array.from(rail.querySelectorAll("[data-mission-mobile-roadmap-phase]"));
};

const initRoadmapInteraction = (root) => {
  const container = root.querySelector("[data-mission-mobile-roadmap]");
  if (!container) {
    return;
  }

  const buttons = renderRoadmapRail(container);
  const roadmapById = new Map(roadmapPhases.map((phase, index) => [phase.id, { ...phase, index }]));
  const kickerEl = container.querySelector("[data-mission-mobile-roadmap-kicker]");
  const countEl = container.querySelector("[data-mission-mobile-roadmap-count]");
  const rangeEl = container.querySelector("[data-mission-mobile-roadmap-range]");
  const statusEl = container.querySelector("[data-mission-mobile-roadmap-status]");
  const titleEl = container.querySelector("[data-mission-mobile-roadmap-title]");
  const summaryEl = container.querySelector("[data-mission-mobile-roadmap-summary]");
  const groupsEl = container.querySelector("[data-mission-mobile-roadmap-groups]");
  const meterEl = container.querySelector("[data-mission-mobile-roadmap-meter]");

  const applyPhase = (phaseId) => {
    const phase = roadmapById.get(phaseId);
    if (!phase) {
      return;
    }

    buttons.forEach((button) => {
      const isActive = button.dataset.missionMobileRoadmapPhase === phaseId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    });

    if (kickerEl) {
      kickerEl.textContent = `Phase ${String(phase.index + 1).padStart(2, "0")}`;
    }
    if (countEl) {
      countEl.textContent = `${String(phase.index + 1).padStart(2, "0")} / ${String(roadmapPhases.length).padStart(2, "0")}`;
    }
    if (rangeEl) {
      rangeEl.textContent = phase.range;
    }
    if (statusEl) {
      statusEl.textContent = phase.status;
    }
    if (titleEl) {
      titleEl.textContent = phase.title;
    }
    if (summaryEl) {
      summaryEl.textContent = phase.summary;
    }
    if (groupsEl) {
      groupsEl.innerHTML = phase.sections
        .map(
          (section) => `
            <section class="mission-mobile-roadmap-group">
              <span class="mission-mobile-roadmap-group-title">${section.title}</span>
              <ul class="mission-mobile-roadmap-list">
                ${section.items.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </section>
          `
        )
        .join("");
    }
    if (meterEl) {
      meterEl.style.width = `${((phase.index + 1) / roadmapPhases.length) * 100}%`;
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      applyPhase(button.dataset.missionMobileRoadmapPhase);
    });

    button.addEventListener("keydown", (event) => {
      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (index + direction + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      applyPhase(buttons[nextIndex].dataset.missionMobileRoadmapPhase);
    });
  });

  applyPhase(roadmapPhases[0]?.id || "");
};

const initSlideNavigation = (root) => {
  const slider = root.querySelector("[data-mission-mobile-slider]");
  const slides = Array.from(root.querySelectorAll("[data-mobile-section]"));
  const slideScrolls = Array.from(root.querySelectorAll(".mission-mobile-slide-scroll"));
  const navButtons = Array.from(root.querySelectorAll("[data-mobile-section-nav]"));
  if (!slider || !slides.length || !navButtons.length) {
    return;
  }

  const sectionIds = slides.map((slide) => slide.dataset.mobileSection);
  let activeTouchGesture = null;

  const setActiveSection = (sectionId) => {
    navButtons.forEach((button) => {
      const isActive = button.dataset.mobileSectionNav === sectionId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const getNearestSlide = () =>
    slides.reduce((closest, slide) => {
      if (!closest) {
        return slide;
      }

      const closestDistance = Math.abs(closest.offsetLeft - slider.scrollLeft);
      const slideDistance = Math.abs(slide.offsetLeft - slider.scrollLeft);
      return slideDistance < closestDistance ? slide : closest;
    }, null);

  const scrollToSection = (sectionId, behavior = "smooth") => {
    const target = slides.find((slide) => slide.dataset.mobileSection === sectionId);
    if (!target) {
      return;
    }

    slider.scrollTo({
      left: target.offsetLeft,
      behavior
    });
    setActiveSection(sectionId);
  };

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      scrollToSection(button.dataset.mobileSectionNav);
    });
  });

  const ignoreSwipeTarget = (target) =>
    Boolean(target.closest("a, button, input, textarea, select, option, label"));

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1 || ignoreSwipeTarget(event.target)) {
      activeTouchGesture = null;
      return;
    }

    const touch = event.touches[0];
    activeTouchGesture = {
      startX: touch.clientX,
      startY: touch.clientY,
      startScrollLeft: slider.scrollLeft,
      lock: ""
    };
    slider.style.scrollBehavior = "auto";
  };

  const handleTouchMove = (event) => {
    if (!activeTouchGesture || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - activeTouchGesture.startX;
    const deltaY = touch.clientY - activeTouchGesture.startY;

    if (!activeTouchGesture.lock) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        return;
      }

      activeTouchGesture.lock = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }

    if (activeTouchGesture.lock !== "x") {
      return;
    }

    event.preventDefault();
    slider.scrollLeft = activeTouchGesture.startScrollLeft - deltaX;
  };

  const handleTouchEnd = () => {
    if (!activeTouchGesture) {
      return;
    }

    const didSwipeHorizontally = activeTouchGesture.lock === "x";
    activeTouchGesture = null;
    slider.style.scrollBehavior = "";

    if (!didSwipeHorizontally) {
      return;
    }

    const nearestSlide = getNearestSlide();
    if (nearestSlide?.dataset?.mobileSection) {
      scrollToSection(nearestSlide.dataset.mobileSection);
    }
  };

  slideScrolls.forEach((slideScroll) => {
    slideScroll.addEventListener("touchstart", handleTouchStart, { passive: true });
    slideScroll.addEventListener("touchmove", handleTouchMove, { passive: false });
    slideScroll.addEventListener("touchend", handleTouchEnd, { passive: true });
    slideScroll.addEventListener("touchcancel", handleTouchEnd, { passive: true });
  });

  if (typeof IntersectionObserver === "function") {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry = null;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        });

        if (bestEntry?.target?.dataset?.mobileSection) {
          setActiveSection(bestEntry.target.dataset.mobileSection);
        }
      },
      {
        root: slider,
        threshold: [0.35, 0.55, 0.75]
      }
    );

    slides.forEach((slide) => observer.observe(slide));
  } else {
    slider.addEventListener("scroll", () => {
      const slideWidth = slides[0]?.clientWidth || 1;
      const index = Math.round(slider.scrollLeft / (slideWidth + 14));
      setActiveSection(sectionIds[Math.max(0, Math.min(sectionIds.length - 1, index))]);
    }, { passive: true });
  }

  setActiveSection(sectionIds[0]);
};

export const initMissionMobileView = (root) => {
  if (!root) {
    return;
  }

  initFrameworkInteraction(root);
  initRoadmapInteraction(root);
  initSlideNavigation(root);
};
