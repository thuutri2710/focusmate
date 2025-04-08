import { BlockRule, MessageType, BlockingMode } from "../types";

// Create and inject the overlay element
function createOverlay(rule: BlockRule, reason: string): void {
  // Check if overlay already exists
  if (document.getElementById('focusmate-shadow-container')) {
    return;
  }

  // Create a shadow root container for isolation
  const shadowContainer = document.createElement('div');
  shadowContainer.id = 'focusmate-shadow-container';
  shadowContainer.style.position = 'fixed';
  shadowContainer.style.top = '0';
  shadowContainer.style.left = '0';
  shadowContainer.style.width = '100%';
  shadowContainer.style.height = '100%';
  shadowContainer.style.zIndex = '2147483647'; // Max z-index
  
  // Create shadow DOM for better isolation from page manipulation
  const shadowRoot = shadowContainer.attachShadow({ mode: 'closed' }); // Use closed mode to prevent access
  
  // Create style element to inject CSS directly into shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .focusmate-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.85) !important;
      backdrop-filter: blur(15px) !important;
      -webkit-backdrop-filter: blur(15px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      animation: fadeIn 0.3s ease-in-out !important;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .focusmate-container {
      max-width: 600px;
      width: 90%;
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
      animation: pulse 2s infinite ease-in-out;
      position: relative;
    }

    .focusmate-logo {
      margin-bottom: 20px;
      font-weight: bold;
      font-size: 28px;
      color: #2d3748;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .focusmate-title {
      color: #e53e3e;
      margin: 0 0 15px 0;
      font-size: 32px;
      font-weight: bold;
      animation: shake 0.5s ease-in-out;
    }

    .focusmate-message {
      font-size: 20px;
      line-height: 1.6;
      color: #4a5568;
      margin: 20px 0;
      font-weight: 500;
    }

    .focusmate-block-info {
      margin-top: 20px;
      background-color: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      text-align: left;
      border-left: 4px solid #e53e3e;
    }

    .focusmate-block-info-title {
      font-size: 18px;
      margin-top: 0;
      color: #2d3748;
    }

    .focusmate-domain-info,
    .focusmate-rule-info,
    .focusmate-reason-info {
      font-size: 14px;
      margin: 5px 0;
    }

    .focusmate-time-info {
      color: #718096;
      font-size: 12px;
      margin: 5px 0;
    }

    .focusmate-quote {
      margin-top: 25px;
      padding: 15px;
      border-radius: 8px;
      background-color: #ebf8ff;
      color: #2b6cb0;
      font-style: italic;
    }

    .focusmate-note {
      font-size: 16px;
      margin-top: 20px;
      color: #4a5568;
    }

    .focusmate-button-container {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 25px;
    }

    .focusmate-button {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      color: white;
    }

    .focusmate-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .focusmate-button-back {
      background-color: #4299e1;
    }

    .focusmate-button-back:hover {
      background-color: #3182ce;
    }

    .focusmate-button-stay {
      background-color: #48bb78;
    }

    .focusmate-button-stay:hover {
      background-color: #38a169;
    }
  `;
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'focusmate-overlay';
  overlay.className = 'focusmate-overlay';

  // No need for inline styles as we're using the CSS file

  // Create content container with improved styling
  const container = document.createElement('div');
  container.className = 'focusmate-container';

  // Logo
  const logo = document.createElement('div');
  logo.textContent = 'FocusMate';
  logo.className = 'focusmate-logo';

  // Title
  const title = document.createElement('h1');
  title.textContent = 'Website Blocked';
  title.className = 'focusmate-title';

  // Message
  const message = document.createElement('p');
  message.textContent = rule.customMessage || 'This website has been blocked by FocusMate to help you stay focused.';
  message.className = 'focusmate-message';

  // Block info container
  const blockInfo = document.createElement('div');
  blockInfo.className = 'focusmate-block-info';

  // Block info title
  const blockInfoTitle = document.createElement('h2');
  blockInfoTitle.textContent = 'Blocking Details';
  blockInfoTitle.className = 'focusmate-block-info-title';

  // Domain info
  const domainInfo = document.createElement('p');
  domainInfo.innerHTML = `Domain: <span>${window.location.hostname}</span>`;
  domainInfo.className = 'focusmate-domain-info';

  // Rule info
  const ruleInfo = document.createElement('p');
  let ruleText = '';
  if (rule.mode === BlockingMode.TIME_LIMIT) {
    const formatDuration = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    };
    ruleText = `Daily time limit: ${formatDuration(rule.timeLimit || 0)}`;
  } else if (rule.mode === BlockingMode.SCHEDULE) {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    if (rule.schedule) {
      const timeRanges = rule.schedule.timeRanges
        .map(range => `${formatTime(range.start)} - ${formatTime(range.end)}`)
        .join(', ');
      const days = rule.schedule.days.join(', ');
      ruleText = `Scheduled: ${timeRanges} on ${days}`;
    }
  } else {
    ruleText = rule.customMessage || 'Standard blocking rule';
  }
  ruleInfo.innerHTML = `Rule: <span>${ruleText}</span>`;
  ruleInfo.className = 'focusmate-rule-info';

  // Reason info
  const reasonInfo = document.createElement('p');
  reasonInfo.innerHTML = `Reason: <span style="font-weight: bold; color: #e53e3e;">${reason}</span>`;
  reasonInfo.className = 'focusmate-reason-info';

  // Time info
  const timeInfo = document.createElement('p');
  timeInfo.textContent = `Blocked at: ${new Date().toLocaleTimeString()}`;
  timeInfo.className = 'focusmate-time-info';

  // Motivational quote
  const quote = document.createElement('div');
  quote.className = 'focusmate-quote';
  
  // Array of motivational quotes
  const quotes = [
    "Focus on being productive instead of busy.",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    "Your focus determines your reality.",
    "Productivity is never an accident. It is always the result of a commitment to excellence.",
    "Don't count the days, make the days count."
  ];
  
  // Select a random quote
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  quote.textContent = `"${randomQuote}"`;
  
  // Note
  const note = document.createElement('p');
  note.textContent = 'You can adjust your blocking rules in the FocusMate extension popup.';
  note.className = 'focusmate-note';

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'focusmate-button-container';
  
  // Back button
  const backButton = document.createElement('a');
  backButton.textContent = 'Go Back';
  backButton.href = 'javascript:void(0)';
  backButton.className = 'focusmate-button focusmate-button-back';
  backButton.onclick = () => {
    history.back();
  };
  
  // Stay focused button
  const stayFocusedButton = document.createElement('a');
  stayFocusedButton.textContent = 'Stay Focused';
  stayFocusedButton.href = 'javascript:void(0)';
  stayFocusedButton.className = 'focusmate-button focusmate-button-stay';
  stayFocusedButton.onclick = () => {
    // Close the current tab
    chrome.runtime.sendMessage({ 
      type: MessageType.CLOSE_CURRENT_TAB 
    });
  };

  // Assemble the block info section
  blockInfo.appendChild(blockInfoTitle);
  blockInfo.appendChild(domainInfo);
  blockInfo.appendChild(ruleInfo);
  blockInfo.appendChild(reasonInfo);
  blockInfo.appendChild(timeInfo);

  // Assemble the container
  container.appendChild(logo);
  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(blockInfo);
  container.appendChild(quote);
  container.appendChild(note);
  
  // Add buttons to button container
  buttonContainer.appendChild(backButton);
  buttonContainer.appendChild(stayFocusedButton);
  
  // Add button container to main container
  container.appendChild(buttonContainer);

  // Add style and container to shadow DOM
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(overlay);
  overlay.appendChild(container);

  // Add shadow container to body
  document.body.appendChild(shadowContainer);

  // Prevent scrolling on the body
  document.body.style.overflow = 'hidden';
  
  // Add event listeners to prevent interaction with the page
  const preventEvent = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  // Capture all events at the document level
  const events = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'touchstart', 'touchend'];
  events.forEach(event => {
    document.addEventListener(event, preventEvent, { capture: true });
  });
  
  // Set up mutation observer to detect if overlay is removed
  const observer = new MutationObserver(() => {
    if (!document.getElementById('focusmate-shadow-container')) {
      // Re-inject if removed
      createOverlay(rule, reason);
    }
  });
  
  observer.observe(document.body, { childList: true });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MessageType.BLOCK_PAGE) {
    const { rule, reason } = message.payload;
    createOverlay(rule, reason);
    sendResponse({ success: true });
    return true;
  }
});

// Check if this page should be blocked on load
chrome.runtime.sendMessage(
  { 
    type: MessageType.CHECK_CURRENT_URL,
    payload: { url: window.location.href }
  },
  (response) => {
    if (response && response.success && response.data && response.data.blocked) {
      createOverlay(response.data.rule, response.data.reason);
    }
  }
);
