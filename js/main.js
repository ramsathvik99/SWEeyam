/**
 * Main initialization script
 * Coordinates all module initialization
 */

import { initNavigation, setActiveNavLink } from './navigation.js';
import { initScrollReveal, initFloatAnimations, initParticles } from './animations.js';
import { initRegistrationForm } from './forms.js';
import { initCarousel } from './carousel.js';

/**
 * Initialize all features when DOM is ready
 */
function init() {
  // Initialize navigation
  initNavigation();
  setActiveNavLink();

  // Initialize animations
  initScrollReveal();
  initFloatAnimations();
  initParticles(28);

  // Initialize forms
  initRegistrationForm();

  // Initialize carousel
  initCarousel();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

