// Types for message passing
enum MessageType {
  BLOCK_PAGE = 'BLOCK_PAGE',
  CHECK_CURRENT_URL = 'CHECK_CURRENT_URL',
  CLOSE_CURRENT_TAB = 'CLOSE_CURRENT_TAB',
  CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY'
}

interface BlockRule {
  id: string;
  domain: string;
  mode: 'block' | 'time_limit' | 'schedule';
  timeLimit?: number;
  schedule?: {
    timeRanges: { start: string; end: string; }[];
    days: string[];
  };
}

// Create and inject the overlay element
function createOverlay(rule: BlockRule, reason: string): void {
  // Check if overlay already exists
  if (document.getElementById('focusmate-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'focusmate-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const container = document.createElement('div');
  container.style.cssText = `
    max-width: 500px;
    width: 90%;
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  `;

  const title = document.createElement('h1');
  title.textContent = 'Access Blocked';
  title.style.cssText = `
    color: #e53e3e;
    margin: 0 0 15px 0;
    font-size: 28px;
  `;

  const message = document.createElement('p');
  message.textContent = `This site (${rule.domain}) is currently blocked to help you stay focused.`;
  message.style.cssText = `
    font-size: 18px;
    line-height: 1.6;
    color: #4a5568;
    margin: 20px 0;
  `;

  const reasonText = document.createElement('p');
  reasonText.textContent = reason;
  reasonText.style.cssText = `
    font-size: 16px;
    color: #718096;
    margin: 15px 0;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 25px;
  `;

  const backButton = document.createElement('button');
  backButton.textContent = 'Go Back';
  backButton.style.cssText = `
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background: #718096;
    color: white;
    cursor: pointer;
    font-weight: bold;
  `;
  backButton.onclick = () => history.back();

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Stay Focused';
  closeButton.style.cssText = `
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background: #e53e3e;
    color: white;
    cursor: pointer;
    font-weight: bold;
  `;
  closeButton.onclick = () => {
    chrome.runtime.sendMessage({ type: MessageType.CLOSE_CURRENT_TAB });
  };

  buttonContainer.appendChild(backButton);
  buttonContainer.appendChild(closeButton);

  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(reasonText);
  container.appendChild(buttonContainer);
  overlay.appendChild(container);

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Prevent interaction with the page
  overlay.addEventListener('click', e => e.stopPropagation());
  overlay.addEventListener('mousedown', e => e.stopPropagation());
  overlay.addEventListener('mouseup', e => e.stopPropagation());
  overlay.addEventListener('keydown', e => e.stopPropagation());
}

// Notify background script that content script is ready
chrome.runtime.sendMessage({ type: MessageType.CONTENT_SCRIPT_READY });

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === MessageType.BLOCK_PAGE) {
    const { rule, reason } = message.payload;
    createOverlay(rule, reason);
    sendResponse({ success: true });
    return true;
  }
  // Always send a response
  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

// Check if this page should be blocked on load
function checkCurrentUrl() {
  chrome.runtime.sendMessage(
    { 
      type: MessageType.CHECK_CURRENT_URL,
      payload: { url: window.location.href }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error checking URL:', chrome.runtime.lastError);
        // Retry after a short delay
        setTimeout(checkCurrentUrl, 500);
        return;
      }
      if (response?.success && response.data?.blocked) {
        createOverlay(response.data.rule, response.data.reason);
      }
    }
  );
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkCurrentUrl);
} else {
  checkCurrentUrl();
}
