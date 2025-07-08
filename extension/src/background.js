/**
 * Browser MCP Extension - Background Script
 * 
 * Handles screenshot capture, console log collection, and communication
 * between content scripts and the MCP server.
 */

class BackgroundService {
  constructor() {
    this.consoleLogs = [];
    this.init();
  }

  init() {
    console.log('[Browser MCP Background] Initializing background service');
    this.setupMessageHandlers();
    this.setupConsoleLogCapture();
  }

  setupMessageHandlers() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Listen for tab updates to reset console logs
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        this.consoleLogs = [];
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'screenshot_request':
          await this.handleScreenshotRequest(sender.tab.id, sendResponse);
          break;
        case 'console_logs_request':
          await this.handleConsoleLogsRequest(sendResponse);
          break;
        default:
          console.warn('[Browser MCP Background] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Browser MCP Background] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleScreenshotRequest(tabId, sendResponse) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 90
      });
      
      sendResponse({
        type: 'screenshot_complete',
        data: { screenshot: dataUrl }
      });
    } catch (error) {
      console.error('[Browser MCP Background] Screenshot capture failed:', error);
      sendResponse({ error: 'Screenshot capture failed: ' + error.message });
    }
  }

  async handleConsoleLogsRequest(sendResponse) {
    sendResponse({
      type: 'console_logs_complete',
      data: { logs: this.consoleLogs }
    });
  }

  setupConsoleLogCapture() {
    // Capture console logs using the debugger API
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        await chrome.debugger.attach({ tabId: activeInfo.tabId }, '1.0');
        await chrome.debugger.sendCommand({ tabId: activeInfo.tabId }, 'Runtime.enable');
        
        chrome.debugger.onEvent.addListener((source, method, params) => {
          if (method === 'Runtime.consoleAPICalled') {
            this.consoleLogs.push({
              timestamp: Date.now(),
              level: params.type,
              args: params.args.map(arg => arg.value || arg.description || String(arg))
            });
            
            // Keep only the last 100 logs to prevent memory issues
            if (this.consoleLogs.length > 100) {
              this.consoleLogs = this.consoleLogs.slice(-100);
            }
          }
        });
      } catch (error) {
        // Debugger attachment might fail, that's okay
        console.log('[Browser MCP Background] Could not attach debugger:', error.message);
      }
    });
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Browser MCP Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Show welcome notification or open options page
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Browser MCP Installed',
      message: 'Browser MCP is ready to automate your browser with AI!'
    });
  }
});
