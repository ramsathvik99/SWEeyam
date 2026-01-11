/**
 * Optimized infinite carousel animation
 * Uses Intersection Observer to pause animation when not visible
 * Ensures smooth 60fps performance on all devices
 */

/**
 * Initialize carousel with Intersection Observer
 * Pauses animation when carousel is not visible to prevent scroll lag
 */
export function initCarousel() {
  const carousel = document.querySelector('.team-preview-carousel');
  if (!carousel) return;

  const scrollContainer = carousel.querySelector('.team-preview-scroll');
  if (!scrollContainer) return;

  // Create Intersection Observer to pause animation when not visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Carousel is visible - resume animation
          scrollContainer.style.animationPlayState = 'running';
        } else {
          // Carousel is not visible - pause animation to save resources
          scrollContainer.style.animationPlayState = 'paused';
        }
      });
    },
    {
      // Trigger when carousel enters/leaves viewport
      threshold: 0.1,
      // Add some margin to start pausing slightly before leaving viewport
      rootMargin: '50px',
    }
  );

  observer.observe(carousel);

  // Pause on hover (optional, already handled by CSS but ensure it works)
  carousel.addEventListener('mouseenter', () => {
    scrollContainer.style.animationPlayState = 'paused';
  });

  carousel.addEventListener('mouseleave', () => {
    if (carousel.getBoundingClientRect().top < window.innerHeight && 
        carousel.getBoundingClientRect().bottom > 0) {
      scrollContainer.style.animationPlayState = 'running';
    }
  });
}



