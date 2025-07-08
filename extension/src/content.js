/**
 * Chrome MCP Extension - Content Script
 * 
 * This content script connects to the MCP server via WebSocket and handles
 * browser automation commands from AI applications.
 */

class WsClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.init();
  }

  async init() {
    console.log('[Chrome MCP] Initializing content script');
    await this.connectToServer();
    this.setupMessageHandlers();
  }

  async connectToServer() {
    try {
      // Try to connect to the MCP server WebSocket (using default port from config)
      const wsUrl = 'ws://localhost:8080';
      console.log(`[Chrome MCP] Connecting to ${wsUrl}`);
      
      // Close any existing connection before creating a new one
      if (this.ws) {
        console.log('[Chrome MCP] Closing existing connection before reconnecting');
        this.ws.close();
        this.ws = null;
      }
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[Chrome MCP] Connected to MCP server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        console.log('[Chrome MCP] Received message:', event.data.substring(0, 100) + (event.data.length > 100 ? '...' : ''));
        try {
          const parsedData = JSON.parse(event.data);
          this.handleMessage(parsedData);
        } catch (error) {
          console.error('[Chrome MCP] Error parsing message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`[Chrome MCP] Connection closed with code ${event.code}, reason: ${event.reason || 'No reason provided'}`);
        this.isConnected = false;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('[Chrome MCP] WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('[Chrome MCP] Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    // Clear any existing reconnection timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    console.log(this.reconnectAttempts);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Exponential backoff with jitter to prevent connection storms
      const baseDelay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      const jitter = Math.random() * 0.5 * baseDelay; // Add up to 50% jitter
      const delay = baseDelay + jitter;
      
      console.log(`[Chrome MCP] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        console.log('[Chrome MCP] Attempting reconnection now...');
        this.connectToServer();
      }, delay);
    } else {
      console.error('[Chrome MCP] Max reconnect attempts reached. Stopping further attempts.');
      // Optionally: notify the user/UI here
      // No further reconnects will be attempted unless triggered manually.
    }
  }

  sendMessage(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Chrome MCP] Cannot send message - not connected');
    }
  }

  async handleMessage(message) {
    console.log('[Chrome MCP] Received message:', message);
    
    // Extract the message ID which needs to be included in the response
    const { id, type, data } = message;
    
    try {
      switch (type) {
        case 'browser_navigate':
          await this.handleNavigate(data, id);
          break;
        case 'browser_click':
          await this.handleClick(data, id);
          break;
        case 'browser_type':
          await this.handleType(data, id);
          break;
        case 'browser_hover':
          await this.handleHover(data, id);
          break;
        case 'browser_select_option':
          await this.handleSelectOption(data, id);
          break;
        case 'browser_press_key':
          await this.handlePressKey(data, id);
          break;
        case 'browser_go_back':
          await this.handleGoBack(id);
          break;
        case 'browser_go_forward':
          await this.handleGoForward(id);
          break;
        case 'capture_screenshot':
          await this.handleScreenshot(id);
          break;
        case 'capture_snapshot':
          await this.handleSnapshot(id);
          break;
        case 'getUrl':
          this.sendMessage({ id, type: 'getUrl_complete', data: { url: window.location.href } });
          break;
        case 'getTitle':
          this.sendMessage({ id, type: 'getTitle_complete', data: { title: document.title } });
          break;
        case 'get_console_logs':
          await this.handleGetConsoleLogs(id);
          break;
        case 'browser_get_inner_html':
          await this.handleGetInnerHTML(data, id);
          break;
        case 'browser_wait':
          await this.handleWait(data, id);
          break;
        default:
          console.warn('[Chrome MCP] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Chrome MCP] Error handling message:', error);
      this.sendMessage({
        type: 'error',
        data: {
          message: error.message,
          stack: error.stack
        }
      });
    }
  }

  setupMessageHandlers() {
    // Listen for page navigation changes
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.sendMessage({
          type: 'navigation_changed',
          data: {
            url: window.location.href,
            title: document.title
          }
        });
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handlePopupMessage(message, sendResponse);
      return true; // Keep message channel open
    });
  }

  handlePopupMessage(message, sendResponse) {
    switch (message.type) {
      case 'get_status':
        sendResponse({ connected: this.isConnected });
        break;
      case 'reconnect':
        this.reconnectAttempts = 0;
        this.connectToServer();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  // Browser action handlers
  async handleNavigate(data, messageId) {
    const { url } = data;
    window.location.href = url;
    this.sendMessage({ id: messageId, type: 'navigate_complete', data: { url } });
  }

  async handleClick(data, messageId) {
    const { selector, ref } = data;
    const element = this.findElement(selector, ref);
    
    if (element) {
      element.click();
      this.sendMessage({ id: messageId, type: 'click_complete', data: { selector, ref } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleWait(data, messageId) {
    const { time } = data;
    console.log(`[Chrome MCP] Waiting for ${time} seconds`);
    await new Promise(resolve => setTimeout(resolve, time * 1000));
    this.sendMessage({ id: messageId, type: 'wait_complete', data: { time } });
  }

  async handleType(data, messageId) {
    const { selector, ref, text, submit } = data;
    const element = this.findElement(selector, ref);
    
    if (element) {
      element.focus();
      element.value = text;
      
      // Trigger input events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      if (submit) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
      
      this.sendMessage({ id: messageId, type: 'type_complete', data: { selector, ref, text } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleHover(data, messageId) {
    const { selector, ref } = data;
    const element = this.findElement(selector, ref);
    
    if (element) {
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      this.sendMessage({ id: messageId, type: 'hover_complete', data: { selector, ref } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleSelectOption(data, messageId) {
    const { selector, ref, values } = data;
    const element = this.findElement(selector, ref);
    
    if (element && element.tagName === 'SELECT') {
      values.forEach(value => {
        const option = element.querySelector(`option[value="${value}"]`);
        if (option) {
          option.selected = true;
        }
      });
      
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.sendMessage({ id: messageId, type: 'select_complete', data: { selector, ref, values } });
    } else {
      throw new Error(`Select element not found: ${selector || ref}`);
    }
  }

  async handlePressKey(data, messageId) {
    const { key } = data;
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    this.sendMessage({ id: messageId, type: 'key_press_complete', data: { key } });
  }

  async handleGoBack(messageId) {
    window.history.back();
    this.sendMessage({ id: messageId, type: 'go_back_complete' });
  }

  async handleGoForward(messageId) {
    window.history.forward();
    this.sendMessage({ id: messageId, type: 'go_forward_complete' });
  }

  async handleScreenshot(messageId) {
    // For screenshots, we need to use the background script
    // Send a message to background script to capture screenshot
    this.sendMessage({ id: messageId, type: 'screenshot_request' });
  }

  async handleSnapshot(messageId) {
    const snapshot = this.captureARIASnapshot();
    this.sendMessage({ 
      id: messageId,
      type: 'snapshot_complete', 
      data: { snapshot } 
    });
  }

  async handleGetConsoleLogs(messageId) {
    // Console logs are captured by background script
    this.sendMessage({ id: messageId, type: 'console_logs_request' });
  }

  // Utility methods
  findElement(selector, ref) {
    if (ref) {
      // If ref is provided, try to find element by accessibility attributes
      return this.findElementByAccessibility(ref);
    } else if (selector) {
      return document.querySelector(selector);
    }
    return null;
  }

  findElementByAccessibility(ref) {
    // Try different accessibility attributes
    const queries = [
      `[aria-label="${ref}"]`,
      `[title="${ref}"]`,
      `[alt="${ref}"]`,
      `[placeholder="${ref}"]`,
      `[data-testid="${ref}"]`,
      `[id="${ref}"]`,
      `[name="${ref}"]`
    ];
    
    for (const query of queries) {
      const element = document.querySelector(query);
      if (element) return element;
    }
    
    // Try text content matching
    const elements = document.querySelectorAll('button, a, input, [role="button"]');
    for (const element of elements) {
      if (element.textContent && element.textContent.trim().includes(ref)) {
        return element;
      }
    }
    
    return null;
  }

  captureARIASnapshot() {
    const snapshot = {
      url: window.location.href,
      title: document.title,
      elements: []
    };
    
    // Capture interactive elements with accessibility information
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );
    
    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      
      // Only include visible elements
      if (rect.width > 0 && rect.height > 0) {
        snapshot.elements.push({
          id: index,
          tagName: element.tagName.toLowerCase(),
          type: element.type || null,
          text: element.textContent?.trim() || '',
          value: element.value || '',
          ariaLabel: element.getAttribute('aria-label'),
          title: element.getAttribute('title'),
          placeholder: element.getAttribute('placeholder'),
          role: element.getAttribute('role'),
          href: element.href || null,
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          visible: this.isElementVisible(element)
        });
      }
    });
    
    return snapshot;
  }

  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  async handleGetInnerHTML(data, messageId) {
    try {
      const { selector, getAll = false, getTextContent = false } = data;
      console.log('[Chrome MCP] Getting content for selector:', selector, 
                 `(getAll: ${getAll}, getTextContent: ${getTextContent})`);
      
      let result;
      
      if (getAll) {
        // Get all matching elements
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          throw new Error(`No elements found for selector: ${selector}`);
        }
        
        // Convert NodeList to Array and extract content
        result = Array.from(elements).map(el => {
          return getTextContent ? el.textContent : el.innerHTML;
        });
        
        console.log(`[Chrome MCP] Found ${result.length} elements matching selector`);
      } else {
        // Get just the first element
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for selector: ${selector}`);
        }
        
        result = getTextContent ? element.textContent : element.innerHTML;
        console.log('[Chrome MCP] Content:', result);
      }
      
      this.sendMessage({
        id: messageId,
        type: 'browser_get_inner_html_complete',
        data: { 
          selector, 
          content: result,
          getAll,
          getTextContent
        }
      });
    } catch (error) {
      console.error('[Chrome MCP] Error getting content:', error);
      this.sendMessage({
        id: messageId,
        type: 'browser_get_inner_html_error',
        data: {
          selector: data.selector,
          getAll: data.getAll || false,
          getTextContent: data.getTextContent || false,
          message: error.message,
          stack: error.stack
        }
      });
    }
  }
}

// Initialize the Chrome MCP client
const wsClient = new WsClient();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = wsClient;
}