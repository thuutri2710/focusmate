import { CSS_CLASSES, MESSAGES } from '../constants/index.js';

export function showElement(elementId) {
  document.getElementById(elementId).classList.remove(CSS_CLASSES.HIDDEN);
}

export function hideElement(elementId) {
  document.getElementById(elementId).classList.add(CSS_CLASSES.HIDDEN);
}

export function setElementValue(elementId, value) {
  document.getElementById(elementId).value = value;
}

export function getElementValue(elementId) {
  return document.getElementById(elementId).value;
}

export function clearElementValue(elementId) {
  document.getElementById(elementId).value = '';
}

export function createEmptyStateElement() {
  const emptyState = document.createElement("div");
  emptyState.className = CSS_CLASSES.EMPTY_STATE.CONTAINER;
  emptyState.innerHTML = `
    <svg class="${CSS_CLASSES.EMPTY_STATE.ICON}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
    <p>${MESSAGES.NO_RULES.TITLE}</p>
    <p class="text-sm mt-2">${MESSAGES.NO_RULES.SUBTITLE}</p>
  `;
  return emptyState;
}
