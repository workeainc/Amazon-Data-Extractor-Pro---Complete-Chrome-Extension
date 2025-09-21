// Amazon Data Extractor Pro - Popup Script (Fixed Version)
// Handles popup UI interactions and data management

class PopupController {
  constructor() {
    this.currentData = [];
    this.trackedProducts = [];
    this.settings = {};
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      await this.loadData();
      this.setupEventListeners();
      this.updateUI();
      
      // Test communication with content script
      await this.testCommunication();
      
      this.updateStatus('Extension loaded successfully', 'success');
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.updateStatus('Error loading extension', 'error');
    }
  }

  async testCommunication() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (this.isAmazonTab(tab.url)) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        console.log('Communication test result:', response);
        if (response && response.status === 'ok') {
          this.updateStatus('Content script communication: OK', 'success');
        } else {
          this.updateStatus('Content script communication: FAILED', 'warning');
        }
      } else {
        this.updateStatus('Navigate to Amazon page to test communication', 'info');
      }
    } catch (error) {
      console.log('Communication test failed:', error);
      this.updateStatus('Content script not loaded on this page', 'warning');
    }
  }

  setupEventListeners() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.attachEventListeners();
      });
    } else {
      this.attachEventListeners();
    }
  }

  attachEventListeners() {
    // Action buttons
    const extractAllBtn = document.getElementById('extract-all');
    if (extractAllBtn) {
      extractAllBtn.addEventListener('click', () => {
        this.extractAllData();
      });
    }

    const extractCurrentBtn = document.getElementById('extract-current');
    if (extractCurrentBtn) {
      extractCurrentBtn.addEventListener('click', () => {
        this.extractCurrentProduct();
      });
    }

    const extractSellersBtn = document.getElementById('extract-sellers');
    if (extractSellersBtn) {
      extractSellersBtn.addEventListener('click', () => {
        this.extractSellerData();
      });
    }

    // Data controls
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortData(e.target.value);
      });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }

    // View tabs
    const viewProductsBtn = document.getElementById('view-products');
    if (viewProductsBtn) {
      viewProductsBtn.addEventListener('click', () => {
        this.switchView('products');
      });
    }

    const viewSellersBtn = document.getElementById('view-sellers');
    if (viewSellersBtn) {
      viewSellersBtn.addEventListener('click', () => {
        this.switchView('sellers');
      });
    }

    // Export controls
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        this.exportData('csv');
      });
    }

    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        this.exportData('json');
      });
    }

    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.clearData();
      });
    }

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    const closeSettingsBtn = document.getElementById('close-settings');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    const resetSettingsBtn = document.getElementById('reset-settings');
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener('click', () => {
        this.resetSettings();
      });
    }

    // Footer links
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.showHelp();
      });
    }

    const aboutBtn = document.getElementById('about-btn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        this.showAbout();
      });
    }

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'dataExtracted') {
        this.handleDataExtracted(request.data);
      }
      if (request.action === 'sellerDataExtracted') {
        this.handleSellerDataExtracted(request.data);
      }
    });
  }

  async extractAllData() {
    this.updateStatus('Extracting data...', 'loading');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isAmazonTab(tab.url)) {
        this.updateStatus('Please navigate to an Amazon page', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      
      if (response) {
        if (response.status === 'error') {
          this.updateStatus(`Error: ${response.error}`, 'error');
          
          // If context is invalidated, suggest page reload
          if (response.error.includes('context invalidated')) {
            this.updateStatus('Extension reloaded. Please refresh the Amazon page and try again.', 'warning');
          }
        } else {
          this.currentData = response;
          this.updateStatus(`Extracted ${response.length} products`, 'success');
          this.displayData();
        }
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      
      if (error.message.includes('Could not establish connection')) {
        this.updateStatus('Content script not loaded. Please refresh the Amazon page.', 'error');
      } else {
        this.updateStatus('Error extracting data. Make sure you are on an Amazon page.', 'error');
      }
    }
  }

  async extractCurrentProduct() {
    this.updateStatus('Extracting current product...', 'loading');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isAmazonTab(tab.url)) {
        this.updateStatus('Please navigate to an Amazon product page', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractCurrentProduct' });
      
      if (response) {
        this.currentData = [response];
        this.updateStatus('Current product extracted', 'success');
        this.displayData();
      }
    } catch (error) {
      console.error('Error extracting current product:', error);
      this.updateStatus('Error extracting current product', 'error');
    }
  }

  async trackCurrentProduct() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isAmazonTab(tab.url)) {
        this.updateStatus('Please navigate to an Amazon product page', 'error');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'trackCurrentProduct' });
      
      if (response) {
        await this.loadTrackedProducts();
        this.updateStatus('Product tracked successfully', 'success');
        this.displayTrackedProducts();
      }
    } catch (error) {
      console.error('Error tracking product:', error);
      this.updateStatus('Error tracking product', 'error');
    }
  }

  async extractSellerData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isAmazonTab(tab.url)) {
        this.updateStatus('Please navigate to an Amazon page', 'error');
        return;
      }

      this.updateStatus('Extracting seller data...', 'info');
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractSellerData' });
      
      if (response) {
        if (response.status === 'error') {
          this.updateStatus(`Error: ${response.error}`, 'error');
        } else {
          this.handleSellerDataExtracted(response);
          this.switchView('sellers'); // Switch to sellers view
        }
      }
    } catch (error) {
      console.error('Error extracting seller data:', error);
      this.updateStatus('Error extracting seller data', 'error');
    }
  }

  clearData() {
    this.currentData = [];
    this.sellerData = [];
    this.updateStatus('Data cleared', 'success');
    this.displayData();
    
    // Clear from storage
    chrome.storage.local.remove(['extractedData', 'sellerData']);
  }

  async loadData() {
    try {
      const { extractedData = [] } = await chrome.storage.local.get(['extractedData']);
      if (extractedData.length > 0) {
        this.currentData = extractedData[extractedData.length - 1].data || [];
      }
      
      await this.loadTrackedProducts();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async loadTrackedProducts() {
    try {
      const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
      this.trackedProducts = Object.values(trackedProducts);
    } catch (error) {
      console.error('Error loading tracked products:', error);
    }
  }

  async loadSettings() {
    try {
      const { settings = {} } = await chrome.storage.local.get(['settings']);
      this.settings = settings;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  displayData() {
    const container = document.getElementById('data-container');
    if (!container) return;
    
    // Check if we have seller data to display
    if (this.sellerData && this.sellerData.length > 0) {
      this.displaySellerData();
      return;
    }
    
    if (!this.currentData || this.currentData.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p>No data extracted yet</p>
          <small>Click "Extract All" or "Extract Seller Info" to get started</small>
        </div>
      `;
      return;
    }

    const dataHTML = this.currentData.map((product, index) => `
      <div class="product-card" data-index="${index}">
        <div class="product-image">
          <img src="${product.imageUrl || 'icons/icon32.png'}" alt="${product.title}" 
               onerror="this.src='icons/icon32.png'">
        </div>
        <div class="product-info">
          <h4 class="product-title" title="${product.title}">${this.truncateText(product.title, 50)}</h4>
          <div class="product-details">
            <span class="product-price">$${product.price || 'N/A'}</span>
            <span class="product-rating">⭐ ${product.rating || 'N/A'}</span>
            <span class="product-reviews">(${product.reviewCount || 0} reviews)</span>
          </div>
          <div class="product-meta">
            <span class="product-asin">ASIN: ${product.asin || 'N/A'}</span>
            <span class="product-seller">${product.seller || 'Amazon'}</span>
          </div>
          <div class="product-actions">
            <button class="action-btn small" onclick="popupController.viewProduct('${product.productUrl}')">
              View Product
            </button>
            <button class="action-btn small" onclick="popupController.copyProductData(${index})">
              Copy Data
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = dataHTML;
  }

  displayTrackedProducts() {
    const container = document.getElementById('tracked-container');
    if (!container) return;
    
    if (!this.trackedProducts || this.trackedProducts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>No tracked products</p>
          <small>Track products to monitor price changes</small>
        </div>
      `;
      return;
    }

    const trackedHTML = this.trackedProducts.map((product, index) => `
      <div class="tracked-card" data-asin="${product.asin}">
        <div class="tracked-image">
          <img src="${product.imageUrl || 'icons/icon32.png'}" alt="${product.title}" 
               onerror="this.src='icons/icon32.png'">
        </div>
        <div class="tracked-info">
          <h4 class="tracked-title" title="${product.title}">${this.truncateText(product.title, 40)}</h4>
          <div class="tracked-price">
            <span class="current-price">$${product.price || 'N/A'}</span>
            ${product.priceHistory && product.priceHistory.length > 1 ? 
              `<span class="price-change ${this.getPriceChangeClass(product)}">${this.getPriceChange(product)}</span>` : 
              ''
            }
          </div>
          <div class="tracked-meta">
            <span class="tracked-date">Tracked: ${this.formatDate(product.trackedAt)}</span>
            <span class="tracked-rating">⭐ ${product.rating || 'N/A'}</span>
          </div>
          <div class="tracked-actions">
            <button class="action-btn small" onclick="popupController.viewProduct('${product.productUrl}')">
              View
            </button>
            <button class="action-btn small danger" onclick="popupController.untrackProduct('${product.asin}')">
              Untrack
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = trackedHTML;
  }

  sortData(sortBy) {
    if (!sortBy || !this.currentData) return;

    this.currentData.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    this.displayData();
  }

  async refreshData() {
    await this.loadData();
    this.displayData();
    this.displayTrackedProducts();
    this.updateUI();
  }

  async exportData() {
    const formatSelect = document.getElementById('export-format');
    const format = formatSelect ? formatSelect.value : 'json';
    
    if (!this.currentData || this.currentData.length === 0) {
      this.updateStatus('No data to export', 'error');
      return;
    }

    this.updateStatus('Exporting data...', 'loading');
    
    try {
      // Simple export functionality
      let content, filename;
      
      switch (format) {
        case 'csv':
          content = this.convertToCSV(this.currentData);
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'excel':
          content = this.convertToCSV(this.currentData); // Simplified
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          content = JSON.stringify(this.currentData, null, 2);
          filename = `amazon-data-${new Date().toISOString().split('T')[0]}.json`;
      }

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.updateStatus(`Data exported as ${filename}`, 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.updateStatus('Export failed', 'error');
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

  async clearTrackedProducts() {
    if (confirm('Are you sure you want to clear all tracked products?')) {
      try {
        await chrome.storage.local.remove(['trackedProducts']);
        this.trackedProducts = [];
        this.displayTrackedProducts();
        this.updateStatus('Tracked products cleared', 'success');
      } catch (error) {
        console.error('Error clearing tracked products:', error);
        this.updateStatus('Error clearing tracked products', 'error');
      }
    }
  }

  async untrackProduct(asin) {
    try {
      const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
      delete trackedProducts[asin];
      await chrome.storage.local.set({ trackedProducts });
      
      await this.loadTrackedProducts();
      this.displayTrackedProducts();
      this.updateStatus('Product untracked', 'success');
    } catch (error) {
      console.error('Error untracking product:', error);
      this.updateStatus('Error untracking product', 'error');
    }
  }

  viewProduct(url) {
    chrome.tabs.create({ url: url });
  }

  copyProductData(index) {
    const product = this.currentData[index];
    const text = `Title: ${product.title}\nPrice: $${product.price}\nRating: ${product.rating}\nASIN: ${product.asin}\nURL: ${product.productUrl}`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.updateStatus('Product data copied to clipboard', 'success');
    }).catch(() => {
      this.updateStatus('Failed to copy data', 'error');
    });
  }

  openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  updateSettingsUI() {
    const autoExtract = document.getElementById('auto-extract');
    if (autoExtract) autoExtract.checked = this.settings.autoExtract || false;
    
    const priceAlerts = document.getElementById('price-alerts');
    if (priceAlerts) priceAlerts.checked = this.settings.priceAlerts || false;
    
    const notificationSound = document.getElementById('notification-sound');
    if (notificationSound) notificationSound.checked = this.settings.notificationSound || false;
    
    const darkMode = document.getElementById('dark-mode');
    if (darkMode) darkMode.checked = this.settings.darkMode || false;
    
    const extractionInterval = document.getElementById('extraction-interval');
    if (extractionInterval) extractionInterval.value = this.settings.extractionInterval || 5;
    
    const maxTracked = document.getElementById('max-tracked');
    if (maxTracked) maxTracked.value = this.settings.maxTrackedProducts || 100;
  }

  async saveSettings() {
    const newSettings = {
      autoExtract: document.getElementById('auto-extract')?.checked || false,
      priceAlerts: document.getElementById('price-alerts')?.checked || false,
      notificationSound: document.getElementById('notification-sound')?.checked || false,
      darkMode: document.getElementById('dark-mode')?.checked || false,
      extractionInterval: parseInt(document.getElementById('extraction-interval')?.value) || 5,
      maxTrackedProducts: parseInt(document.getElementById('max-tracked')?.value) || 100
    };

    try {
      await chrome.storage.local.set({ settings: newSettings });
      this.settings = { ...this.settings, ...newSettings };
      this.closeSettings();
      this.updateStatus('Settings saved', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.updateStatus('Failed to save settings', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      try {
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
        this.settings = defaultSettings;
        this.updateSettingsUI();
        this.updateStatus('Settings reset to default', 'success');
      } catch (error) {
        console.error('Error resetting settings:', error);
        this.updateStatus('Failed to reset settings', 'error');
      }
    }
  }

  showHelp() {
    alert(`Amazon Data Extractor Pro - Help

1. Navigate to any Amazon page
2. Click "Extract All" to extract all visible products
3. Click "Current Product" to extract the current product page
4. Click "Track Product" to monitor price changes
5. Use the export feature to save your data
6. Right-click on Amazon pages for quick actions

Keyboard Shortcuts:
- Ctrl+Shift+E: Extract all products
- Ctrl+Shift+T: Track current product
- Ctrl+Shift+S: Sort options

For more help, check the extension documentation.`);
  }

  showAbout() {
    alert(`Amazon Data Extractor Pro v1.0.0

A powerful Chrome extension for extracting and managing Amazon product data.

Features:
• Real-time data extraction
• Product tracking with price alerts
• Multiple export formats
• Automated sorting and filtering
• Context menu integration

Developed for efficient Amazon data management.`);
  }

  updateStatus(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    
    if (statusText) statusText.textContent = message;
    
    const icons = {
      info: '🔍',
      loading: '⏳',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    if (statusIcon) statusIcon.textContent = icons[type] || icons.info;
  }

  updateUI() {
    const productCount = document.getElementById('product-count');
    const trackedCount = document.getElementById('tracked-count');
    
    if (productCount) productCount.textContent = this.currentData.length;
    if (trackedCount) trackedCount.textContent = this.trackedProducts.length;
  }

  handleDataExtracted(data) {
    this.currentData = data;
    this.displayData();
    this.updateUI();
  }

  handleSellerDataExtracted(data) {
    this.sellerData = data;
    this.displaySellerData();
    this.updateStatus(`Seller data extracted: ${data.length} sellers`, 'success');
  }

  switchView(viewType) {
    // Update tab states
    const productsTab = document.getElementById('view-products');
    const sellersTab = document.getElementById('view-sellers');
    
    if (productsTab && sellersTab) {
      productsTab.classList.toggle('active', viewType === 'products');
      sellersTab.classList.toggle('active', viewType === 'sellers');
    }
    
    // Display appropriate data
    if (viewType === 'sellers') {
      this.displaySellerData();
    } else {
      this.displayData();
    }
  }

  displaySellerData() {
    const container = document.getElementById('data-container');
    if (!container || !this.sellerData) return;

    const sellerHTML = this.sellerData.map((seller, index) => `
      <div class="seller-card" data-index="${index}">
        <div class="seller-info">
          <h4 class="seller-name">${seller.name || 'Unknown Seller'}</h4>
          <div class="seller-details">
            ${seller.rating ? `<span class="seller-rating">⭐ ${seller.rating}</span>` : ''}
            ${seller.feedbackCount ? `<span class="seller-feedback">(${seller.feedbackCount} reviews)</span>` : ''}
          </div>
          ${seller.profileUrl ? `<div class="seller-profile"><a href="${seller.profileUrl}" target="_blank">View Profile</a></div>` : ''}
          ${seller.contactInfo ? `<div class="seller-contact">Contact: ${seller.contactInfo}</div>` : ''}
          ${seller.socialLinks && seller.socialLinks.length > 0 ? `
            <div class="seller-social">
              <span class="social-label">Social:</span>
              ${seller.socialLinks.map(link => `<a href="${link.url}" target="_blank" class="social-link">${link.platform}</a>`).join(', ')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = sellerHTML;
  }

  isAmazonTab(url) {
    return url && url.includes('amazon.');
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getPriceChange(product) {
    if (!product.priceHistory || product.priceHistory.length < 2) return '';
    
    const current = product.priceHistory[product.priceHistory.length - 1].price;
    const previous = product.priceHistory[product.priceHistory.length - 2].price;
    const change = current - previous;
    
    return change > 0 ? `+$${change.toFixed(2)}` : `$${change.toFixed(2)}`;
  }

  getPriceChangeClass(product) {
    if (!product.priceHistory || product.priceHistory.length < 2) return '';
    
    const current = product.priceHistory[product.priceHistory.length - 1].price;
    const previous = product.priceHistory[product.priceHistory.length - 2].price;
    
    return current > previous ? 'price-increase' : 'price-decrease';
  }
}

// Initialize popup controller when DOM is ready
let popupController;

// Ensure PopupController is available globally for debugging
window.PopupController = PopupController;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PopupController...');
    popupController = new PopupController();
    window.popupController = popupController;
  });
} else {
  console.log('DOM already loaded, initializing PopupController...');
  popupController = new PopupController();
  window.popupController = popupController;
}