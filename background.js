// Amazon Data Extractor Pro - Background Script
// Service worker for data management, notifications, and automation

class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.setupContextMenus();
    this.setupAlarms();
    this.setupInstallation();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'dataExtracted':
          this.handleDataExtracted(request.data, sender.tab);
          break;
        case 'getTrackedProducts':
          this.getTrackedProducts().then(sendResponse);
          return true;
        case 'exportData':
          this.exportData(request.data, request.format).then(sendResponse);
          return true;
        case 'clearData':
          this.clearData().then(sendResponse);
          return true;
        case 'schedulePriceCheck':
          this.schedulePriceCheck(request.asin, request.interval);
          break;
        case 'getSettings':
          this.getSettings().then(sendResponse);
          return true;
        case 'updateSettings':
          this.updateSettings(request.settings).then(sendResponse);
          return true;
      }
    });
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'extractProduct',
      title: 'Extract Product Data',
      contexts: ['page'],
      documentUrlPatterns: [
        'https://www.amazon.com/*',
        'https://www.amazon.co.uk/*',
        'https://www.amazon.de/*',
        'https://www.amazon.fr/*',
        'https://www.amazon.it/*',
        'https://www.amazon.es/*',
        'https://www.amazon.ca/*',
        'https://www.amazon.com.au/*',
        'https://www.amazon.in/*',
        'https://www.amazon.co.jp/*'
      ]
    });

    chrome.contextMenus.create({
      id: 'trackProduct',
      title: 'Track This Product',
      contexts: ['page'],
      documentUrlPatterns: [
        'https://www.amazon.com/dp/*',
        'https://www.amazon.co.uk/dp/*',
        'https://www.amazon.de/dp/*',
        'https://www.amazon.fr/dp/*',
        'https://www.amazon.it/dp/*',
        'https://www.amazon.es/dp/*',
        'https://www.amazon.ca/dp/*',
        'https://www.amazon.com.au/dp/*',
        'https://www.amazon.in/dp/*',
        'https://www.amazon.co.jp/dp/*'
      ]
    });

    chrome.contextMenus.create({
      id: 'openExtractor',
      title: 'Open Data Extractor',
      contexts: ['page'],
      documentUrlPatterns: [
        'https://www.amazon.com/*',
        'https://www.amazon.co.uk/*',
        'https://www.amazon.de/*',
        'https://www.amazon.fr/*',
        'https://www.amazon.it/*',
        'https://www.amazon.es/*',
        'https://www.amazon.ca/*',
        'https://www.amazon.com.au/*',
        'https://www.amazon.in/*',
        'https://www.amazon.co.jp/*'
      ]
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupAlarms() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name.startsWith('priceCheck_')) {
        this.performPriceCheck(alarm.name.replace('priceCheck_', ''));
      }
    });
  }

  setupInstallation() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.showWelcomeNotification();
        this.setDefaultSettings();
      }
    });
  }

  async handleDataExtracted(data, tab) {
    try {
      // Store extracted data
      const { extractedData = [] } = await chrome.storage.local.get(['extractedData']);
      extractedData.push({
        data,
        timestamp: new Date().toISOString(),
        url: tab.url,
        tabId: tab.id
      });

      // Keep only last 1000 extractions
      if (extractedData.length > 1000) {
        extractedData.splice(0, extractedData.length - 1000);
      }

      await chrome.storage.local.set({ extractedData });

      // Show notification
      this.showNotification(
        'Data Extracted',
        `Successfully extracted ${data.length} products`,
        'extraction-complete'
      );

      // Update badge
      chrome.action.setBadgeText({
        text: data.length.toString(),
        tabId: tab.id
      });

    } catch (error) {
      console.error('Error handling extracted data:', error);
    }
  }

  async getTrackedProducts() {
    const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
    return Object.values(trackedProducts);
  }

  async exportData(data, format = 'json') {
    try {
      let content, mimeType, filename;

      switch (format) {
        case 'csv':
          content = this.convertToCSV(data);
          mimeType = 'text/csv';
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'excel':
          content = this.convertToExcel(data);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        default:
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.json`;
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });

      return { success: true, filename };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  convertToExcel(data) {
    // Simple Excel conversion - in a real implementation, you'd use a library like xlsx
    return this.convertToCSV(data);
  }

  async clearData() {
    try {
      await chrome.storage.local.clear();
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }

  schedulePriceCheck(asin, interval = 24) {
    const alarmName = `priceCheck_${asin}`;
    chrome.alarms.create(alarmName, {
      delayInMinutes: interval * 60,
      periodInMinutes: interval * 60
    });
  }

  async performPriceCheck(asin) {
    try {
      // Get tracked product
      const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
      const product = trackedProducts[asin];
      
      if (!product) return;

      // Find active Amazon tab
      const tabs = await chrome.tabs.query({ url: 'https://www.amazon.*/*' });
      if (tabs.length === 0) return;

      // Inject script to check current price
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: (asin) => {
          // This would be executed in the content script context
          return window.amazonExtractor?.extractCurrentProduct?.();
        },
        args: [asin]
      });

      if (results && results[0] && results[0].result) {
        const currentData = results[0].result;
        const newPrice = currentData.price;

        if (newPrice && newPrice !== product.price) {
          // Update price history
          product.priceHistory.push({
            price: newPrice,
            date: new Date().toISOString()
          });
          product.price = newPrice;

          trackedProducts[asin] = product;
          await chrome.storage.local.set({ trackedProducts });

          // Show price change notification
          this.showNotification(
            'Price Alert',
            `${product.title} price changed from $${product.priceHistory[product.priceHistory.length - 2]?.price} to $${newPrice}`,
            'price-change'
          );
        }
      }
    } catch (error) {
      console.error('Error performing price check:', error);
    }
  }

  async getSettings() {
    const { settings = {} } = await chrome.storage.local.get(['settings']);
    return {
      autoExtract: settings.autoExtract || false,
      priceAlerts: settings.priceAlerts || true,
      exportFormat: settings.exportFormat || 'json',
      notificationSound: settings.notificationSound || true,
      darkMode: settings.darkMode || false,
      ...settings
    };
  }

  async updateSettings(newSettings) {
    try {
      const { settings = {} } = await chrome.storage.local.get(['settings']);
      const updatedSettings = { ...settings, ...newSettings };
      await chrome.storage.local.set({ settings: updatedSettings });
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  }

  async setDefaultSettings() {
    const defaultSettings = {
      autoExtract: false,
      priceAlerts: true,
      exportFormat: 'json',
      notificationSound: true,
      darkMode: false,
      extractionInterval: 5,
      maxTrackedProducts: 100
    };

    await chrome.storage.local.set({ settings: defaultSettings });
  }

  handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'extractProduct':
        chrome.tabs.sendMessage(tab.id, { action: 'extractCurrentProduct' });
        break;
      case 'trackProduct':
        chrome.tabs.sendMessage(tab.id, { action: 'trackCurrentProduct' });
        break;
      case 'openExtractor':
        chrome.action.openPopup();
        break;
    }
  }

  showNotification(title, message, type = 'info') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }

  showWelcomeNotification() {
    this.showNotification(
      'Amazon Data Extractor Pro',
      'Extension installed successfully! Right-click on Amazon pages to get started.',
      'welcome'
    );
  }
}

// Initialize the background service
new BackgroundService();
