/**
 * Main initialization script (non-module version)
 * Coordinates all module initialization
 */

(function() {
  'use strict';

  // Utility functions
  function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit = 250) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  function isInViewport(element, offset = 80) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight - offset && rect.bottom > 0;
  }

  // Navigation
  function initNavigation() {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;

    const handleScroll = throttle(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function setActiveNavLink() {
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

  // Animations
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length === 0) return;

    const checkReveals = throttle(() => {
      reveals.forEach(el => {
        if (isInViewport(el, 80) && !el.classList.contains('active')) {
          el.classList.add('active');
        }
      });
    }, 100);

    window.addEventListener('scroll', checkReveals, { passive: true });
    window.addEventListener('resize', checkReveals, { passive: true });
    checkReveals();
  }

  function initFloatAnimations() {
    const floats = document.querySelectorAll('.ai-float');
    if (floats.length === 0) return;

    const handleMouseMove = throttle((e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;

      floats.forEach((el, i) => {
        el.style.setProperty('--px', `${x / (i + 1)}px`);
        el.style.setProperty('--py', `${y / (i + 1)}px`);
      });
    }, 16);

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  function initParticles(count = 28) {
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

  // Forms
  function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const registrationTypeRadios = form.querySelectorAll('input[name="registrationType"]');
    const engagementSection = document.getElementById('engagementSection');
    const yearOrExpLabel = document.getElementById('yearOrExpLabel');
    const yearOrExpInput = form.querySelector('input[name="yearOrExp"]');

    registrationTypeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        const type = this.value;
        if (type === 'alumni' || type === 'industry') {
          if (engagementSection) engagementSection.style.display = 'block';
          if (yearOrExpLabel) yearOrExpLabel.textContent = 'Years of Experience';
          if (yearOrExpInput) {
            yearOrExpInput.name = 'yearsOfExperience';
            yearOrExpInput.placeholder = 'e.g., 5';
          }
        } else {
          if (engagementSection) engagementSection.style.display = 'none';
          if (yearOrExpLabel) yearOrExpLabel.textContent = 'Year or Experience';
          if (yearOrExpInput) {
            yearOrExpInput.name = 'yearOrExp';
            yearOrExpInput.placeholder = '';
          }
        }
      });
    });

    form.addEventListener('submit', debounce(async function(e) {
      e.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      if (!submitButton) return;

      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      try {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
          if (data[key]) {
            if (Array.isArray(data[key])) {
              data[key].push(value);
            } else {
              data[key] = [data[key], value];
            }
          } else {
            data[key] = value;
          }
        }

        const expertiseCheckboxes = form.querySelectorAll('input[name="expertiseAreas"]:checked');
        if (expertiseCheckboxes.length > 0) {
          data.expertiseAreas = Array.from(expertiseCheckboxes).map(cb => cb.value);
        }

        const engagementCheckboxes = form.querySelectorAll('input[name="preferredEngagement"]:checked');
        if (engagementCheckboxes.length > 0) {
          data.preferredEngagement = Array.from(engagementCheckboxes).map(cb => cb.value);
        }

        if (data.registrationType === 'student') {
          data.graduationYear = data.yearOrExp || null;
          data.yearsOfExperience = null;
        } else {
          data.yearsOfExperience = data.yearOrExp || null;
          data.graduationYear = null;
        }
        delete data.yearOrExp;

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { message: errorText || 'Server error occurred' };
          }
          throw new Error(errorData.message || errorData.error || 'Unknown error');
        }

        const result = await response.json();
        if (result.success) {
          form.style.display = 'none';
          const successMessage = document.getElementById('successMessage');
          if (successMessage) {
            successMessage.style.display = 'block';
            successMessage.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } catch (error) {
        let errorMsg = 'An error occurred. Please try again later.';
        if (error.message && error.message.includes('Failed to fetch')) {
          errorMsg = 'Cannot connect to server. Please make sure the server is running.';
        } else if (error.message) {
          errorMsg = error.message;
        }
        alert('Registration failed: ' + errorMsg);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }, 300));
  }

  // Carousel animation with Intersection Observer
  function initCarousel() {
    const carousel = document.querySelector('.team-preview-carousel');
    if (!carousel) return;

    const scrollContainer = carousel.querySelector('.team-preview-scroll');
    if (!scrollContainer) return;

    // Create Intersection Observer to pause animation when not visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scrollContainer.style.animationPlayState = 'running';
          } else {
            scrollContainer.style.animationPlayState = 'paused';
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(carousel);

    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
      scrollContainer.style.animationPlayState = 'paused';
    });

    carousel.addEventListener('mouseleave', () => {
      const rect = carousel.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        scrollContainer.style.animationPlayState = 'running';
      }
    });
  }

  // Initialize all features
  function init() {
    initNavigation();
    setActiveNavLink();
    initScrollReveal();
    initFloatAnimations();
    initParticles(28);
    initRegistrationForm();
    initCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

