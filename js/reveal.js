/** Fade-up on scroll: adds .in to each .rv element the first time it enters the viewport. */
(function () {
  'use strict';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.rv').forEach((el) => observer.observe(el));
})();
