// This file contains template strings that will be replaced with React components

export const TEMPLATES = {
  TIME_RANGE_ROW: `
    <div class="time-range-row flex items-center mb-2">
      <input type="time" class="time-start border rounded p-1 mr-2" required>
      <span>to</span>
      <input type="time" class="time-end border rounded p-1 mx-2" required>
      <button type="button" class="remove-time-range text-red-500 hover:text-red-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `,
  
  TOAST: `
    <div class="toast fixed top-4 right-4 p-4 rounded shadow-lg z-50 transform transition-transform duration-300 translate-x-full">
      <div class="flex items-center">
        <div class="toast-icon mr-3"></div>
        <div class="toast-message"></div>
        <button class="toast-close ml-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `,
  
  CONFIRMATION_MODAL: `
    <div class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 hidden" id="modal-container">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4 modal-title"></h3>
        <p class="mb-6 modal-message"></p>
        <div class="flex justify-end space-x-2">
          <button class="modal-cancel px-4 py-2 border rounded hover:bg-gray-100"></button>
          <button class="modal-confirm px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"></button>
        </div>
      </div>
    </div>
  `
} as const;
