import { ToastProps, ConfirmationModalProps } from "../types";

/**
 * Show an element by ID
 * @param elementId ID of the element to show
 */
export function showElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove("hidden");
  }
}

/**
 * Hide an element by ID
 * @param elementId ID of the element to hide
 */
export function hideElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add("hidden");
  }
}

/**
 * Get the value of an element
 * @param elementId ID of the element
 * @returns The value of the element or empty string if not found
 */
export function getElementValue(elementId: string): string {
  const element = document.getElementById(elementId) as HTMLInputElement | HTMLSelectElement | null;
  return element ? element.value : "";
}

/**
 * Format milliseconds into a human-readable time string
 * @param ms Time in milliseconds
 * @returns Formatted time string (e.g., "2h 30m")
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return "0s";

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  if (seconds > 0 && hours === 0) result += `${seconds}s`;

  return result.trim();
}

/**
 * Format a date to a readable string
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Check if it's a new day compared to the last reset
 * @param lastReset Last reset timestamp
 * @param resetTime Time of day to reset (HH:MM)
 * @returns Boolean indicating if it's a new day
 */
export function isNewDay(lastReset: number, resetTime: string): boolean {
  if (!lastReset) return true;

  const now = new Date();
  const lastResetDate = new Date(lastReset);

  // Parse reset time
  const [hours, minutes] = resetTime.split(":").map(Number);
  const resetDate = new Date(now);
  resetDate.setHours(hours, minutes, 0, 0);

  // If current time is before reset time, use previous day's reset time
  if (now < resetDate) {
    resetDate.setDate(resetDate.getDate() - 1);
  }

  // Check if last reset was before the reset time
  return lastResetDate < resetDate;
}

// These functions will be replaced with React components in the refactored app
// They are kept here for reference during migration

/**
 * Show a toast notification
 * @param props Toast properties
 */
export function showToast(props: ToastProps): void {
  console.log("Toast would show:", props);
  // This will be implemented as a React component
}

/**
 * Show an error toast notification
 * @param message Error message
 */
export function showErrorToast(message: string): void {
  showToast({
    message,
    type: "error",
  });
}

/**
 * Show a success toast notification
 * @param message Success message
 */
export function showSuccessToast(message: string): void {
  showToast({
    message,
    type: "success",
  });
}

/**
 * Show a confirmation modal
 * @param props Confirmation modal properties
 */
export function showConfirmationModal(props: ConfirmationModalProps): void {
  console.log("Confirmation modal would show:", props);
  // This will be implemented as a React component
}
