import { CSS_CLASSES } from '../constants/index.js';

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
