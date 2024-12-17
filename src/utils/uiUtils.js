// UI utility functions for handling error messages and notifications

/**
 * Shows an error message in a toast-like notification
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the message in milliseconds
 */
export function showErrorToast(message, duration = 3000) {
  // Remove any existing error toasts
  const existingToasts = document.querySelectorAll('.error-toast');
  existingToasts.forEach(toast => toast.remove());

  // Create new toast element
  const toast = document.createElement('div');
  toast.className = 'error-toast fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in';
  toast.style.animation = 'fadeIn 0.3s ease-in-out';
  toast.textContent = message;

  // Add to document
  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Shows validation errors below form fields
 * @param {HTMLFormElement} form - The form containing the fields
 * @param {Object} validationResult - The validation result containing errors
 */
export function showFormValidationErrors(form, validationResult) {
  // Clear existing error messages
  const existingErrors = form.querySelectorAll('.validation-error');
  existingErrors.forEach(error => error.remove());

  // Remove error styles from inputs
  form.querySelectorAll('.error-border').forEach(input => {
    input.classList.remove('error-border', 'border-red-500');
  });

  if (!validationResult.isValid) {
    validationResult.errors.forEach(error => {
      // Find the relevant input field based on the error message
      let inputField = null;
      if (error.includes('Website URL')) {
        inputField = form.querySelector('input[name="websiteUrl"]');
      } else if (error.includes('start time')) {
        inputField = form.querySelector('input[name="startTime"]');
      } else if (error.includes('end time')) {
        inputField = form.querySelector('input[name="endTime"]');
      } else if (error.includes('time limit')) {
        inputField = form.querySelector('input[name="dailyTimeLimit"]');
      }

      if (inputField) {
        // Add error styles to input
        inputField.classList.add('error-border', 'border-red-500');

        // Create and insert error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error text-red-500 text-sm mt-1';
        errorDiv.textContent = error;
        inputField.parentNode.insertBefore(errorDiv, inputField.nextSibling);
      }
    });
  }
}

// Add necessary styles to document
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(1rem); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(1rem); }
  }
`;
document.head.appendChild(style);
