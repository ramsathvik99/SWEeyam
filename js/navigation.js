/**
 * Navigation functionality
 * Handles navbar scroll behavior and active state management
 */

import { throttle } from './utils.js';

/**
 * Initialize navbar scroll behavior
 */
export function initNavigation() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) return;

  // Throttle scroll event for better performance
  const handleScroll = throttle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Set initial state
  handleScroll();
}

/**
 * Set active nav link based on current page
 */
export function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}



