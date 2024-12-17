// UI utility functions for handling error messages and notifications

/**
 * Shows an error message in a toast-like notification
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the message in milliseconds
 */
export function showErrorToast(message, duration = 3000) {
  // Remove any existing error toasts
  const existingToasts = document.querySelectorAll(".error-toast");
  existingToasts.forEach((toast) => toast.remove());

  // Create new toast element
  const toast = document.createElement("div");
  toast.className =
    "error-toast fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in";
  toast.style.animation = "fadeIn 0.3s ease-in-out";
  toast.textContent = message;

  // Add to document
  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease-in-out";
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
  const existingErrors = form.querySelectorAll(".validation-error");
  existingErrors.forEach((error) => error.remove());

  // Remove error styles from inputs
  form.querySelectorAll(".error-border").forEach((input) => {
    input.classList.remove("error-border", "border-red-500");
  });

  if (!validationResult.isValid) {
    validationResult.errors.forEach((error) => {
      // Find the relevant input field based on the error message
      let inputField = null;
      if (error.includes("Website URL")) {
        inputField = form.querySelector('input[name="websiteUrl"]');
      } else if (error.includes("start time")) {
        inputField = form.querySelector('input[name="startTime"]');
      } else if (error.includes("end time")) {
        inputField = form.querySelector('input[name="endTime"]');
      } else if (error.includes("time limit")) {
        inputField = form.querySelector('input[name="dailyTimeLimit"]');
      }

      if (inputField) {
        // Add error styles to input
        inputField.classList.add("error-border", "border-red-500");

        // Create and insert error message
        const errorDiv = document.createElement("div");
        errorDiv.className = "validation-error text-red-500 text-sm mt-1";
        errorDiv.textContent = error;
        inputField.parentNode.insertBefore(errorDiv, inputField.nextSibling);
      }
    });
  }
}

/**
 * Shows a toast message that fades out after a specified duration
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success' or 'error')
 * @param {number} duration - Duration in milliseconds before the toast disappears
 */
export function showToast(message, type = "success", duration = 1500) {
  // Get or create toast container
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none z-50";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  // Set toast classes based on type
  const baseClasses =
    "rounded-md py-2.5 px-4 text-sm font-medium shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2";
  const typeClasses = type === "success" 
    ? "bg-green-50 text-green-800 border border-green-200" 
    : "bg-red-50 text-red-800 border border-red-200";

  toast.className = `${baseClasses} ${typeClasses}`;

  // Add icon based on type
  const icon = document.createElement("span");
  if (type === "success") {
    icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
  } else {
    icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
  }
  toast.appendChild(icon);

  // Add message
  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);

  // Add to container
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => {
      container.removeChild(toast);
    }, 300); // Wait for fade out animation
  }, duration);
}

/**
 * Shows a confirmation modal and returns a promise that resolves with the user's choice
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirmationModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("delete-rule-modal");
    const confirmButton = document.getElementById("confirm-delete");
    const cancelButton = document.getElementById("cancel-delete");

    const handleConfirm = () => {
      modal.classList.add("hidden");
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.add("hidden");
      cleanup();
      resolve(false);
    };

    const handleOutsideClick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };

    const cleanup = () => {
      confirmButton.removeEventListener("click", handleConfirm);
      cancelButton.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleOutsideClick);
    };

    confirmButton.addEventListener("click", handleConfirm);
    cancelButton.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleOutsideClick);

    modal.classList.remove("hidden");
  });
}

// Add necessary styles to document
const style = document.createElement("style");
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
