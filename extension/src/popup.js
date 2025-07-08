/**
 * Chrome MCP Extension - Popup Script
 * 
 * Handles the extension popup interface and status display.
 */

class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.updateStatus();
    this.setupEventListeners();
    
    // Update status every 2 seconds
    setInterval(() => this.updateStatus(), 2000);
  }

  setupEventListeners() {
    const reconnectBtn = document.getElementById('reconnectBtn');
    reconnectBtn.addEventListener('click', () => {
      this.reconnectToServer();
    });
  }

  async updateStatus() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        document.getElementById('currentUrl').textContent = tab.url;
        
        // Try to get connection status from content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'get_status' });
          this.updateStatusDisplay(response?.connected || false);
        } catch (error) {
          // Content script might not be loaded or responding
          this.updateStatusDisplay(false);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      this.updateStatusDisplay(false);
    }
  }

  updateStatusDisplay(connected) {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const reconnectBtn = document.getElementById('reconnectBtn');

    if (connected) {
      statusElement.className = 'status connected';
      statusText.textContent = 'Connected to MCP Server';
      reconnectBtn.textContent = 'Disconnect';
      reconnectBtn.disabled = false;
    } else {
      statusElement.className = 'status disconnected';
      statusText.textContent = 'Disconnected from MCP Server';
      reconnectBtn.textContent = 'Reconnect to Server';
      reconnectBtn.disabled = false;
    }
  }

  async reconnectToServer() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { type: 'reconnect' });
        
        // Update status after a short delay
        setTimeout(() => this.updateStatus(), 1000);
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
