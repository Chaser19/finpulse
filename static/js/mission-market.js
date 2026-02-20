(function () {
  const circles = Array.from(document.querySelectorAll(".market-circle"));
  const titleEl = document.getElementById("marketDetailTitle");
  const copyEl = document.getElementById("marketDetailCopy");

  if (!circles.length || !titleEl || !copyEl) {
    return;
  }

  const setActiveCircle = (circle) => {
    circles.forEach((item) => {
      item.classList.toggle("is-active", item === circle);
    });
    titleEl.textContent = circle.dataset.marketTitle || "";
    copyEl.textContent = circle.dataset.marketCopy || "";
  };

  circles.forEach((circle) => {
    circle.addEventListener("mouseenter", () => setActiveCircle(circle));
    circle.addEventListener("focus", () => setActiveCircle(circle));
    circle.addEventListener("click", () => setActiveCircle(circle));
  });

  const defaultCircle = circles.find((circle) => circle.classList.contains("is-active")) || circles[0];
  setActiveCircle(defaultCircle);
})();
