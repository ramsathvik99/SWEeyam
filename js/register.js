// Registration Form Handling

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const registrationTypeRadios = document.querySelectorAll('input[name="registrationType"]');
    const engagementSection = document.getElementById('engagementSection');
    const yearOrExpLabel = document.getElementById('yearOrExpLabel');
    const yearOrExpInput = document.querySelector('input[name="yearOrExp"]');

    // Show/hide sections based on registration type
    registrationTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const type = this.value;

            if (type === 'alumni' || type === 'industry') {
                engagementSection.style.display = 'block';
                yearOrExpLabel.textContent = 'Years of Experience';
                yearOrExpInput.name = 'yearsOfExperience';
                yearOrExpInput.placeholder = 'e.g., 5';
            } else {
                engagementSection.style.display = 'none';
                yearOrExpLabel.textContent = 'Years of Experience';
                yearOrExpInput.name = 'yearsOfExperience';
                yearOrExpInput.placeholder = 'e.g., 5';
            }
        });
    });



    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Collect form data
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes)
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
        data.expertiseAreas = Array.from(expertiseCheckboxes).map(cb => cb.value);

        const engagementCheckboxes = form.querySelectorAll('input[name="preferredEngagement"]:checked');
        data.preferredEngagement = Array.from(engagementCheckboxes).map(cb => cb.value);

        // Handle graduation year or years of experience
        if (data.registrationType === 'student') {
            data.graduationYear = data.yearOrExp || null;
            data.yearsOfExperience = null;
        } else {
            data.yearsOfExperience = data.yearOrExp || null;
            data.graduationYear = null;
        }
        delete data.yearOrExp;

        try {
            console.log('Submitting registration data:', data);
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { message: errorText || 'Server error occurred' };
                }
                alert('Registration failed: ' + (errorData.message || errorData.error || 'Unknown error'));
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }

            const result = await response.json();
            console.log('Registration result:', result);

            if (result.success) {
                // Show success message
                form.style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                
                // Scroll to success message
                document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
            } else {
                // Show error message
                alert('Registration failed: ' + (result.message || 'Unknown error'));
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        } catch (error) {
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            
            let errorMsg = 'An error occurred. Please try again later.';
            
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMsg = 'Cannot connect to server. Please make sure the server is running on http://localhost:3000';
            } else if (error.message) {
                errorMsg += '\n\nError: ' + error.message;
            }
            
            alert(errorMsg);
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
});
