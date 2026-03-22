import { initMissionEngagementChart } from "./mission-engagement-chart.js";
import { initMissionRoadmapTimeline } from "./mission-market.js";
import { initMissionMobileView } from "./mission-mobile.js";
import { initMissionScrollSections } from "./mission-scroll-sections.js";
import { initMissionHeadlineSplit } from "./mission-title-split.js";

const DESKTOP_MQ = "(min-width: 768px)";

const setRootState = (root, isActive) => {
  if (!root) {
    return;
  }

  root.hidden = !isActive;
  root.setAttribute("aria-hidden", isActive ? "false" : "true");
  if ("inert" in root) {
    root.inert = !isActive;
  }
};

const initMissionPage = async () => {
  const desktopRoot = document.querySelector('[data-mission-view="desktop"]');
  const mobileRoot = document.querySelector('[data-mission-view="mobile"]');
  const signalVeinsSvg = document.querySelector(".signal-veins-svg");
  if (!desktopRoot || !mobileRoot) {
    return;
  }

  const mediaQuery = window.matchMedia(DESKTOP_MQ);
  let currentVariant = "";
  let desktopStaticReady = false;
  let mobileReady = false;
  let desktopScrollCleanup = () => {};

  const ensureDesktopStatic = async () => {
    if (desktopStaticReady) {
      return;
    }

    initMissionRoadmapTimeline(desktopRoot);
    initMissionEngagementChart(desktopRoot, { variant: "desktop" });
    await initMissionHeadlineSplit(desktopRoot);
    desktopStaticReady = true;
  };

  const ensureMobile = () => {
    if (mobileReady) {
      return;
    }

    initMissionMobileView(mobileRoot);
    initMissionEngagementChart(mobileRoot, { variant: "mobile" });
    mobileReady = true;
  };

  const activateVariant = async () => {
    const nextVariant = mediaQuery.matches ? "desktop" : "mobile";
    if (nextVariant === currentVariant) {
      return;
    }

    desktopScrollCleanup();
    desktopScrollCleanup = () => {};

    setRootState(desktopRoot, nextVariant === "desktop");
    setRootState(mobileRoot, nextVariant === "mobile");
    if (signalVeinsSvg) {
      signalVeinsSvg.setAttribute(
        "preserveAspectRatio",
        nextVariant === "desktop" ? "none" : "xMidYMid slice"
      );
    }

    if (nextVariant === "desktop") {
      await ensureDesktopStatic();
      desktopScrollCleanup = await initMissionScrollSections(desktopRoot);
    } else {
      ensureMobile();
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    currentVariant = nextVariant;
  };

  await activateVariant();

  const handleChange = () => {
    activateVariant().catch((error) => {
      console.warn("Mission view switch failed.", error);
    });
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleChange);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMissionPage().catch((error) => {
      console.warn("Mission page failed to initialise.", error);
    });
  }, { once: true });
} else {
  initMissionPage().catch((error) => {
    console.warn("Mission page failed to initialise.", error);
  });
}
