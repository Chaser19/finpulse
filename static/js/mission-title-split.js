const MISSION_HEADLINE_SELECTOR = "#mission-signal-headline";

const initMissionHeadlineSplit = async () => {
  const headline = document.querySelector(MISSION_HEADLINE_SELECTOR);
  if (!headline) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  try {
    const { createTimeline, splitText, stagger } = await import("https://cdn.jsdelivr.net/npm/animejs/+esm");

    const { words, chars } = splitText(headline, {
      words: { wrap: "clip" },
      chars: true
    });

    createTimeline({
      defaults: {
        duration: 1200,
        ease: "out(3)"
      }
    })
      .add(
        words,
        {
          y: ["105%", "0%"],
          opacity: [0, 1]
        },
        stagger(200)
      )
      .add(
        chars,
        {
          opacity: [0.35, 1]
        },
        stagger(8)
      )
      .init();
  } catch (error) {
    console.warn("Mission headline split animation failed to load.", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMissionHeadlineSplit, { once: true });
} else {
  initMissionHeadlineSplit();
}
