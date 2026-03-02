// Subtle pointer-driven parallax for the glow layer.
(function () {
  const glow = document.querySelector('.bg-glow');
  if (!glow || typeof window === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    glow.style.setProperty('--mx', '0');
    glow.style.setProperty('--my', '0');
    return;
  }

  let rafId = 0;
  let targetX = 0;
  let targetY = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function update() {
    rafId = 0;
    glow.style.setProperty('--mx', targetX.toFixed(4));
    glow.style.setProperty('--my', targetY.toFixed(4));
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(update);
  }

  function onPointerMove(event) {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;

    // Normalize to [-1, 1] and cap movement for a gentle breathing effect.
    targetX = clamp((x - 0.5) * 2, -1, 1);
    targetY = clamp((y - 0.5) * 2, -1, 1);
    scheduleUpdate();
  }

  function onPointerLeave() {
    targetX = 0;
    targetY = 0;
    scheduleUpdate();
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
})();
