(() => {
  const svg = document.querySelector(".signal-veins-svg");
  const panel = document.querySelector(".signal-veins-panel");
  if (!svg) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const viewBox = svg.viewBox && svg.viewBox.baseVal;
  const width = viewBox?.width || 1200;
  const height = viewBox?.height || 700;
  const paths = Array.from(svg.querySelectorAll("path"));

  if (!paths.length) {
    return;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const TAU = Math.PI * 2;
  const HORIZONTAL_OVERSCAN = Math.max(120, width * 0.14);
  const VERTICAL_OVERSCAN = Math.max(72, height * 0.14);
  const PANEL_OVERSCAN = 44;
  const BASE_WAVE = {
    freqA: 1.02,
    freqB: 2.02,
    speedA: 0.35,
    speedB: 0.22,
    amplitudeMin: 24,
    amplitudeSpread: 9,
    amplitudeBScale: 0.2,
    phaseSpread: 0.52
  };
  const MID_WAVE = {
    freqA: 1.12,
    freqB: 2.18,
    speedA: 0.39,
    speedB: 0.25,
    amplitudeMin: 28,
    amplitudeSpread: 10,
    amplitudeBScale: 0.23,
    phaseSpread: 0.6
  };
  const ACCENT_WAVE = {
    freqA: 1.22,
    freqB: 2.34,
    speedA: 0.44,
    speedB: 0.29,
    amplitudeMin: 32,
    amplitudeSpread: 11,
    amplitudeBScale: 0.26,
    phaseSpread: 0.68
  };

  // Keep wave math light to avoid frame spikes while sections snap/animate.
  const WAVE_SEGMENTS = 12;
  const SAMPLE_COUNT = WAVE_SEGMENTS + 1;
  const sampleProgress = Array.from({ length: SAMPLE_COUNT }, (_, i) => i / WAVE_SEGMENTS);
  const sampleX = sampleProgress.map((progress) => -HORIZONTAL_OVERSCAN + progress * (width + HORIZONTAL_OVERSCAN * 2));
  const sampleXFixed = sampleX.map((x) => x.toFixed(1));
  const sampleMidXFixed = sampleX.map((x, i) =>
    i < SAMPLE_COUNT - 1 ? ((x + sampleX[i + 1]) / 2).toFixed(1) : "0.0"
  );
  const sampleEnvelope = sampleProgress.map((progress) => 0.42 + 0.58 * Math.sin(progress * Math.PI));

  const buildWavePath = (model, timeSec) => {
    const ys = model.sampleY;
    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const progress = sampleProgress[i];
      const envelope = sampleEnvelope[i];
      const waveA = Math.sin(progress * TAU * model.freqA - timeSec * model.speedA + model.phaseA);
      const waveB = Math.sin(progress * TAU * model.freqB - timeSec * model.speedB + model.phaseB);
      ys[i] = clamp(
        model.baseY + model.amplitudeA * envelope * waveA + model.amplitudeB * envelope * waveB,
        -VERTICAL_OVERSCAN,
        height + VERTICAL_OVERSCAN
      );
    }

    let d = `M${sampleXFixed[0]} ${ys[0].toFixed(1)}`;
    for (let i = 1; i < SAMPLE_COUNT - 1; i += 1) {
      const midY = ((ys[i] + ys[i + 1]) * 0.5).toFixed(1);
      d += ` Q${sampleXFixed[i]} ${ys[i].toFixed(1)}, ${sampleMidXFixed[i]} ${midY}`;
    }

    const lastIndex = SAMPLE_COUNT - 1;
    const prevIndex = lastIndex - 1;
    d += ` Q${sampleXFixed[prevIndex]} ${ys[prevIndex].toFixed(1)}, ${sampleXFixed[lastIndex]} ${ys[lastIndex].toFixed(1)}`;
    return d;
  };

  const laneCount = paths.length;
  const waveModels = paths.map((path, index) => {
    const strokeWidth = Number.parseFloat(path.getAttribute("stroke-width") || "0");
    const isAccentBand = strokeWidth >= 2.25;
    const isMidBand = strokeWidth >= 2.0 && strokeWidth < 2.25;
    const groupModel = isAccentBand ? ACCENT_WAVE : isMidBand ? MID_WAVE : BASE_WAVE;
    const laneY = ((index + 1) / (laneCount + 1)) * height;
    const laneProgress = laneCount > 1 ? index / (laneCount - 1) : 0;
    const accentBias = isAccentBand ? 0.7 : isMidBand ? 0.56 : 0.45;
    const amplitude =
      groupModel.amplitudeMin +
      Math.sin(laneProgress * Math.PI) * groupModel.amplitudeSpread +
      Math.cos((index + 1) * 1.13) * accentBias;
    const lanePhase =
      (laneProgress - 0.5) * groupModel.phaseSpread +
      Math.sin((index + 1) * 0.91) * 0.08;
    const laneVariance = Math.cos((index + 1) * 0.77) * 0.035;

    const model = {
      path,
      baseY: laneY,
      amplitudeA: amplitude,
      amplitudeB: amplitude * groupModel.amplitudeBScale,
      freqA: groupModel.freqA + laneVariance,
      freqB: groupModel.freqB + laneVariance * 1.4,
      speedA: groupModel.speedA + laneVariance * 0.08,
      speedB: groupModel.speedB + laneVariance * 0.06,
      phaseA: lanePhase,
      phaseB: lanePhase * 0.72 + laneVariance * 0.8,
      sampleY: new Float32Array(SAMPLE_COUNT)
    };

    path.setAttribute("d", buildWavePath(model, 0));
    path.setAttribute("stroke-dasharray", "none");

    const animate = path.querySelector("animate");
    if (animate) {
      animate.remove();
    }

    return model;
  });

  if (!reducedMotion) {
    const animateWaves = (timestamp) => {
      if (document.hidden) {
        window.requestAnimationFrame(animateWaves);
        return;
      }

      const timeSec = timestamp * 0.001;
      waveModels.forEach((model) => {
        model.path.setAttribute("d", buildWavePath(model, timeSec));
      });
      window.requestAnimationFrame(animateWaves);
    };

    window.requestAnimationFrame(animateWaves);
  }

  if (!panel || reducedMotion) {
    return;
  }

  const supportsHoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!supportsHoverPointer) {
    return;
  }

  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const MAX_X_OFFSET = 8;
  const MAX_Y_OFFSET = 6;
  const EASE = 0.08;

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = 0;
  let isScrollSnapping = false;
  let scrollSnapTimerId = 0;

  const applyTransform = () => {
    panel.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
  };

  const tick = () => {
    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;
    applyTransform();

    const settled =
      Math.abs(targetX - currentX) < 0.05 &&
      Math.abs(targetY - currentY) < 0.05;

    if (settled) {
      rafId = 0;
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const scheduleTick = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(tick);
  };

  const setTargetFromPointer = (event) => {
    if (isScrollSnapping) {
      return;
    }

    const nx = clamp01(event.clientX / window.innerWidth);
    const ny = clamp01(event.clientY / window.innerHeight);
    targetX = clamp((nx - 0.5) * 2 * MAX_X_OFFSET, -PANEL_OVERSCAN, PANEL_OVERSCAN);
    targetY = clamp((ny - 0.5) * 2 * MAX_Y_OFFSET, -PANEL_OVERSCAN, PANEL_OVERSCAN);
    scheduleTick();
  };

  const resetTarget = () => {
    targetX = 0;
    targetY = 0;
    scheduleTick();
  };

  const handleScroll = () => {
    isScrollSnapping = true;
    targetX = 0;
    targetY = 0;
    scheduleTick();

    if (scrollSnapTimerId) {
      window.clearTimeout(scrollSnapTimerId);
    }
    scrollSnapTimerId = window.setTimeout(() => {
      isScrollSnapping = false;
    }, 140);
  };

  window.addEventListener("pointermove", setTargetFromPointer, { passive: true });
  window.addEventListener("pointerleave", resetTarget, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
})();
