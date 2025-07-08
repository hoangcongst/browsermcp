/**
 * Browser MCP Extension - Content Script
 * 
 * This content script connects to the MCP server via WebSocket and handles
 * browser automation commands from AI applications.
 */

class BrowserMCPClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.init();
  }

  async init() {
    console.log('[Browser MCP] Initializing content script');
    await this.connectToServer();
    this.setupMessageHandlers();
  }

  async connectToServer() {
    try {
      // Try to connect to the MCP server WebSocket (using default port from config)
      const wsUrl = 'ws://localhost:8080';
      console.log(`[Browser MCP] Connecting to ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[Browser MCP] Connected to MCP server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send initial connection message
        this.sendMessage({
          type: 'connection',
          data: {
            url: window.location.href,
            title: document.title,
            userAgent: navigator.userAgent
          }
        });
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onclose = () => {
        console.log('[Browser MCP] Connection closed');
        this.isConnected = false;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('[Browser MCP] WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('[Browser MCP] Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Browser MCP] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectToServer();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[Browser MCP] Max reconnection attempts reached');
    }
  }

  sendMessage(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Browser MCP] Cannot send message - not connected');
    }
  }

  async handleMessage(message) {
    console.log('[Browser MCP] Received message:', message);
    
    // Extract the message ID which needs to be included in the response
    const { id, type, data } = message;
    
    try {
      switch (type) {
        case 'browser_navigate':
          await this.handleNavigate(data);
          break;
        case 'browser_click':
          await this.handleClick(data);
          break;
        case 'browser_type':
          await this.handleType(data);
          break;
        case 'browser_hover':
          await this.handleHover(data);
          break;
        case 'browser_select_option':
          await this.handleSelectOption(data);
          break;
        case 'browser_press_key':
          await this.handlePressKey(data);
          break;
        case 'browser_go_back':
          await this.handleGoBack();
          break;
        case 'browser_go_forward':
          await this.handleGoForward();
          break;
        case 'capture_screenshot':
          await this.handleScreenshot();
          break;
        case 'capture_snapshot':
          await this.handleSnapshot();
          break;
        case 'get_console_logs':
          await this.handleGetConsoleLogs();
          break;
        case 'browser_execute_js':
          await this.handleExecuteJavaScript(data, id);
          break;
        case 'browser_get_inner_html':
          await this.handleGetInnerHTML(data, id);
          break;
        default:
          console.warn('[Browser MCP] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Browser MCP] Error handling message:', error);
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
  async handleNavigate(data) {
    const { url } = data;
    window.location.href = url;
    this.sendMessage({ type: 'navigate_complete', data: { url } });
  }

  async handleClick(data) {
    const { selector, ref } = data;
    const element = this.findElement(selector, ref);
    
    if (element) {
      element.click();
      this.sendMessage({ type: 'click_complete', data: { selector, ref } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleType(data) {
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
      
      this.sendMessage({ type: 'type_complete', data: { selector, ref, text } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleHover(data) {
    const { selector, ref } = data;
    const element = this.findElement(selector, ref);
    
    if (element) {
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      this.sendMessage({ type: 'hover_complete', data: { selector, ref } });
    } else {
      throw new Error(`Element not found: ${selector || ref}`);
    }
  }

  async handleSelectOption(data) {
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
      this.sendMessage({ type: 'select_complete', data: { selector, ref, values } });
    } else {
      throw new Error(`Select element not found: ${selector || ref}`);
    }
  }

  async handlePressKey(data) {
    const { key } = data;
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    this.sendMessage({ type: 'key_press_complete', data: { key } });
  }

  async handleGoBack() {
    window.history.back();
    this.sendMessage({ type: 'go_back_complete' });
  }

  async handleGoForward() {
    window.history.forward();
    this.sendMessage({ type: 'go_forward_complete' });
  }

  async handleScreenshot() {
    // For screenshots, we need to use the background script
    // Send a message to background script to capture screenshot
    this.sendMessage({ type: 'screenshot_request' });
  }

  async handleSnapshot() {
    const snapshot = this.captureARIASnapshot();
    this.sendMessage({ 
      type: 'snapshot_complete', 
      data: { snapshot } 
    });
  }

  async handleGetConsoleLogs() {
    // Console logs are captured by background script
    this.sendMessage({ type: 'console_logs_request' });
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

  async handleExecuteJavaScript(data, messageId) {
    try {
      const { script } = data;
      console.log('[Browser MCP] Executing JavaScript:', script);
      
      // Execute the script in the page context and get the result
      const result = eval(script);
      
      // Handle promises if the script returns one
      const finalResult = result instanceof Promise ? await result : result;
      
      // Send the result back with the original message ID
      this.sendMessage({
        id: messageId,
        type: 'browser_execute_js_complete',
        data: finalResult
      });
    } catch (error) {
      console.error('[Browser MCP] Error executing JavaScript:', error);
      this.sendMessage({
        id: messageId,
        type: 'browser_execute_js_error',
        data: {
          message: error.message,
          stack: error.stack
        }
      });
    }
  }

  async handleGetInnerHTML(data, messageId) {
    try {
      const { selector, getAll = false, getTextContent = false } = data;
      console.log('[Browser MCP] Getting content for selector:', selector, 
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
        
        console.log(`[Browser MCP] Found ${result.length} elements matching selector`);
      } else {
        // Get just the first element
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for selector: ${selector}`);
        }
        
        result = getTextContent ? element.textContent : element.innerHTML;
        console.log('[Browser MCP] Content:', result);
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
      console.error('[Browser MCP] Error getting content:', error);
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

// Initialize the Browser MCP client
const browserMCP = new BrowserMCPClient();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserMCPClient;
}