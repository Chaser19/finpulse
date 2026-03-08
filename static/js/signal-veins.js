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

  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const TAU = Math.PI * 2;

  // Keep wave math light to avoid frame spikes while sections snap/animate.
  const WAVE_SEGMENTS = 12;
  const SAMPLE_COUNT = WAVE_SEGMENTS + 1;
  const sampleProgress = Array.from({ length: SAMPLE_COUNT }, (_, i) => i / WAVE_SEGMENTS);
  const sampleX = sampleProgress.map((progress) => progress * width);
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
        24,
        height - 24
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
    const isPrimaryBand = index < Math.ceil(laneCount / 2);
    const laneY = ((index + 1) / (laneCount + 1)) * height;
    const amplitude = isPrimaryBand ? rand(40, 58) : rand(26, 42);

    const model = {
      path,
      baseY: laneY,
      amplitudeA: amplitude,
      amplitudeB: amplitude * rand(0.18, 0.32),
      freqA: rand(0.95, 1.5),
      freqB: rand(1.8, 2.8),
      speedA: rand(0.47, 0.78),
      speedB: rand(0.3, 0.54),
      phaseA: rand(0, TAU),
      phaseB: rand(0, TAU),
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
  const MAX_X_OFFSET = 10;
  const MAX_Y_OFFSET = 7;
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
    targetX = (nx - 0.5) * 2 * MAX_X_OFFSET;
    targetY = (ny - 0.5) * 2 * MAX_Y_OFFSET;
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
