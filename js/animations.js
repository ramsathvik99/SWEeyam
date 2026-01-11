/**
 * Animation and visual effects
 * Handles scroll reveals, particles, and float animations
 */

import { throttle, isInViewport } from './utils.js';

/**
 * Initialize scroll reveal animations
 */
export function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;

  // Throttle scroll event for better performance
  const checkReveals = throttle(() => {
    reveals.forEach(el => {
      if (isInViewport(el, 80) && !el.classList.contains('active')) {
        el.classList.add('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('resize', checkReveals, { passive: true });
  
  // Initial check
  checkReveals();
}

/**
 * Initialize floating AI elements with mouse parallax
 */
export function initFloatAnimations() {
  const floats = document.querySelectorAll('.ai-float');
  if (floats.length === 0) return;

  // Throttle mousemove for better performance
  const handleMouseMove = throttle((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 24;

    floats.forEach((el, i) => {
      el.style.setProperty('--px', `${x / (i + 1)}px`);
      el.style.setProperty('--py', `${y / (i + 1)}px`);
    });
  }, 16); // ~60fps

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
}

/**
 * Initialize particle effects
 * @param {number} count - Number of particles to create
 */
export function initParticles(count = 28) {
  // Only create particles if not already created
  if (document.querySelector('.particle')) return;

  // Add particles to global-effects container for optimized compositing
  const globalEffects = document.querySelector('.global-effects');
  if (!globalEffects) return;

  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    fragment.appendChild(p);
  }
  
  globalEffects.appendChild(fragment);
}

