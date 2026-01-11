/**
 * Form handling and validation
 * Optimized form submission with error handling
 */

import { debounce } from './utils.js';

/**
 * Initialize registration form
 */
export function initRegistrationForm() {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  const registrationTypeRadios = form.querySelectorAll('input[name="registrationType"]');
  const engagementSection = document.getElementById('engagementSection');
  const yearOrExpLabel = document.getElementById('yearOrExpLabel');
  const yearOrExpInput = form.querySelector('input[name="yearOrExp"]');

  // Show/hide sections based on registration type
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

  // Form submission with debounced validation
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

      // Convert FormData to object
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

      // Handle expertise areas and preferred engagement as arrays
      const expertiseCheckboxes = form.querySelectorAll('input[name="expertiseAreas"]:checked');
      if (expertiseCheckboxes.length > 0) {
        data.expertiseAreas = Array.from(expertiseCheckboxes).map(cb => cb.value);
      }

      const engagementCheckboxes = form.querySelectorAll('input[name="preferredEngagement"]:checked');
      if (engagementCheckboxes.length > 0) {
        data.preferredEngagement = Array.from(engagementCheckboxes).map(cb => cb.value);
      }

      // Handle graduation year or years of experience
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
        headers: {
          'Content-Type': 'application/json',
        },
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



