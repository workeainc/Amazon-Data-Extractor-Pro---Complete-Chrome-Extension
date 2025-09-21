// Amazon Data Extractor Pro - Content Script
// High-performance data extraction and automation for Amazon pages

class AmazonDataExtractor {
  constructor() {
    this.isExtracting = false;
    this.extractedData = [];
    this.trackedProducts = new Set();
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.createUI();
    this.loadTrackedProducts();
    this.observePageChanges();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received message:', request);
      
      try {
        // Check if extension context is still valid
        if (!chrome.runtime || !chrome.runtime.id) {
          sendResponse({ 
            error: 'Extension context invalidated. Please reload the page.',
            status: 'error' 
          });
          return true;
        }
        
        switch (request.action) {
          case 'extractData':
            this.extractAllData().then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'extractCurrentProduct':
            this.extractCurrentProduct().then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'extractSellerData':
            this.extractSellerInformation().then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'trackProduct':
            this.trackProduct(request.data).then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'getTrackedProducts':
            this.getTrackedProducts().then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'sortProducts':
            this.sortProducts(request.sortBy).then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'filterProducts':
            this.filterProducts(request.filter).then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'automateAction':
            this.automateAction(request.actionType).then(sendResponse).catch(error => {
              sendResponse({ error: error.message, status: 'error' });
            });
            return true;
          case 'ping':
            // Simple ping to test communication
            sendResponse({ status: 'ok', message: 'Content script is working' });
            return true;
        }
      } catch (error) {
        console.error('Error in message listener:', error);
        sendResponse({ 
          error: error.message, 
          status: 'error' 
        });
        return true;
      }
    });
  }

  createUI() {
    // Create floating control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'amazon-extractor-panel';
    controlPanel.innerHTML = `
      <div class="extractor-header">
        <h3>Amazon Data Extractor</h3>
        <button id="toggle-panel" class="toggle-btn"></button>
      </div>
      <div class="extractor-controls">
        <div class="search-section">
          <div class="search-input-group">
            <input type="text" id="search-keyword" placeholder="Enter product keyword..." />
            <button id="search-btn" class="btn primary">Search</button>
          </div>
          <div class="popular-keywords">
            <span class="keyword-label">Popular:</span>
            <div class="keyword-tags">
              <span class="keyword-tag" data-keyword="laptop">Laptop</span>
              <span class="keyword-tag" data-keyword="smartphone">Smartphone</span>
              <span class="keyword-tag" data-keyword="headphones">Headphones</span>
              <span class="keyword-tag" data-keyword="camera">Camera</span>
              <span class="keyword-tag" data-keyword="watch">Watch</span>
              <span class="keyword-tag" data-keyword="shoes">Shoes</span>
              <span class="keyword-tag" data-keyword="book">Books</span>
              <span class="keyword-tag" data-keyword="kitchen">Kitchen</span>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button id="extract-all" class="btn primary">Extract All Products</button>
          <button id="extract-current" class="btn secondary">Extract Current</button>
          <button id="track-product" class="btn success">Track Product</button>
          <button id="extract-sellers" class="btn info">Extract Seller Info</button>
        </div>
        <div class="automation-controls">
          <select id="sort-select">
            <option value="">Sort by...</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="reviews">Review Count</option>
            <option value="title">Title A-Z</option>
          </select>
          <button id="apply-sort" class="btn small">Apply</button>
        </div>
        <div class="filter-controls">
          <input type="text" id="price-min" placeholder="Min Price" />
          <input type="text" id="price-max" placeholder="Max Price" />
          <input type="text" id="rating-min" placeholder="Min Rating" />
          <button id="apply-filter" class="btn small">Filter</button>
        </div>
      </div>
      <div class="extractor-status">
        <div id="status-text">Ready</div>
        <div id="progress-bar" class="progress-bar">
          <div id="progress-fill"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    this.setupUIEvents();
  }

  setupUIEvents() {
    // Search functionality
    document.getElementById('search-btn').addEventListener('click', () => {
      this.performSearch();
    });

    document.getElementById('search-keyword').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Popular keyword tags
    document.querySelectorAll('.keyword-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const keyword = tag.getAttribute('data-keyword');
        document.getElementById('search-keyword').value = keyword;
        this.performSearch();
      });
    });

    // Action buttons
    document.getElementById('extract-all').addEventListener('click', () => {
      this.extractAllData();
    });

    document.getElementById('extract-current').addEventListener('click', () => {
      this.extractCurrentProduct();
    });

    document.getElementById('track-product').addEventListener('click', () => {
      this.trackCurrentProduct();
    });

    document.getElementById('extract-sellers').addEventListener('click', () => {
      this.extractSellerInformation();
    });

    document.getElementById('apply-sort').addEventListener('click', () => {
      const sortBy = document.getElementById('sort-select').value;
      if (sortBy) this.sortProducts(sortBy);
    });

    document.getElementById('apply-filter').addEventListener('click', () => {
      const filter = {
        minPrice: document.getElementById('price-min').value,
        maxPrice: document.getElementById('price-max').value,
        minRating: document.getElementById('rating-min').value
      };
      this.filterProducts(filter);
    });

    document.getElementById('toggle-panel').addEventListener('click', () => {
      this.togglePanel();
    });
  }

  performSearch() {
    const keyword = document.getElementById('search-keyword').value.trim();
    
    if (!keyword) {
      this.updateStatus('Please enter a search keyword', 'warning');
      return;
    }

    this.updateStatus(`Searching for: ${keyword}...`, 'loading');
    
    // Construct Amazon search URL
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    
    // Navigate to search results
    window.location.href = searchUrl;
  }

  async extractAllData() {
    if (this.isExtracting) return;
    
    this.isExtracting = true;
    this.updateStatus('Extracting product data...');
    
    try {
      // Check if extension context is still valid
      if (!chrome.runtime || !chrome.runtime.id) {
        throw new Error('Extension context invalidated. Please reload the page.');
      }
      
      const products = [];
      const productElements = this.getProductElements();
      
      for (let i = 0; i < productElements.length; i++) {
        const productData = this.extractProductData(productElements[i]);
        if (productData) {
          products.push(productData);
        }
        this.updateProgress((i + 1) / productElements.length * 100);
      }
      
      this.extractedData = products;
      this.updateStatus(`Extracted ${products.length} products`);
      
      // Send data to popup with error handling
      try {
        chrome.runtime.sendMessage({
          action: 'dataExtracted',
          data: products
        });
      } catch (messageError) {
        console.warn('Could not send message to popup:', messageError);
        // Store data locally as fallback
        localStorage.setItem('amazon-extracted-data', JSON.stringify(products));
      }
      
      return products;
    } catch (error) {
      console.error('Error extracting data:', error);
      this.updateStatus('Error extracting data: ' + error.message);
      
      // If context is invalidated, show reload message
      if (error.message.includes('context invalidated')) {
        this.updateStatus('Extension reloaded. Please refresh the page.');
      }
    } finally {
      this.isExtracting = false;
    }
  }

  async extractCurrentProduct() {
    try {
      const productData = this.extractProductData(document);
      if (productData) {
        this.updateStatus('Current product extracted');
        return productData;
      }
    } catch (error) {
      console.error('Error extracting current product:', error);
      this.updateStatus('Error extracting current product');
    }
  }

  extractProductData(element) {
    try {
      const data = {
        title: this.extractTitle(element),
        price: this.extractPrice(element),
        asin: this.extractASIN(element),
        rating: this.extractRating(element),
        reviewCount: this.extractReviewCount(element),
        imageUrl: this.extractImageUrl(element),
        productUrl: this.extractProductUrl(element),
        availability: this.extractAvailability(element),
        seller: this.extractSeller(element),
        category: this.extractCategory(element),
        extractedAt: new Date().toISOString(),
        pageUrl: window.location.href
      };

      return data;
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  extractTitle(element) {
    const selectors = [
      '#productTitle',
      'h1.a-size-large',
      '.a-size-large.product-title',
      '[data-automation-id="product-title"]',
      'h1[data-automation-id="product-title"]',
      '.s-size-mini .s-color-base',
      '.a-size-base-plus.a-color-base.a-text-normal'
    ];
    
    for (const selector of selectors) {
      const titleElement = element.querySelector(selector);
      if (titleElement) {
        return titleElement.textContent.trim();
      }
    }
    return null;
  }

  extractPrice(element) {
    const selectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '.a-price-range',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay',
      '.a-price.a-text-price.a-size-base.apexPriceToPay'
    ];
    
    for (const selector of selectors) {
      const priceElement = element.querySelector(selector);
      if (priceElement) {
        const priceText = priceElement.textContent.replace(/[^\d.,]/g, '');
        const price = parseFloat(priceText.replace(',', ''));
        if (!isNaN(price)) {
          return price;
        }
      }
    }
    return null;
  }

  extractASIN(element) {
    // Try to extract ASIN from URL
    const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (urlMatch) return urlMatch[1];
    
    // Try to extract from data attributes
    const asinElement = element.querySelector('[data-asin]');
    if (asinElement) {
      return asinElement.getAttribute('data-asin');
    }
    
    // Try to extract from product links
    const productLinks = element.querySelectorAll('a[href*="/dp/"]');
    for (const link of productLinks) {
      const match = link.href.match(/\/dp\/([A-Z0-9]{10})/);
      if (match) return match[1];
    }
    
    return null;
  }

  extractRating(element) {
    const selectors = [
      '.a-icon-alt',
      '.a-icon-star-small .a-icon-alt',
      '[data-automation-id="star-rating"]',
      '.a-icon.a-icon-star-small'
    ];
    
    for (const selector of selectors) {
      const ratingElement = element.querySelector(selector);
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
        const match = ratingText.match(/(\d+\.?\d*)/);
        if (match) {
          return parseFloat(match[1]);
        }
      }
    }
    return null;
  }

  extractReviewCount(element) {
    const selectors = [
      '#acrCustomerReviewText',
      '.a-size-base.a-color-secondary',
      '[data-automation-id="review-count"]',
      '.a-link-normal .a-size-base'
    ];
    
    for (const selector of selectors) {
      const reviewElement = element.querySelector(selector);
      if (reviewElement) {
        const reviewText = reviewElement.textContent;
        const match = reviewText.match(/(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    return null;
  }

  extractImageUrl(element) {
    const selectors = [
      '#landingImage',
      '.a-dynamic-image',
      '[data-automation-id="product-image"]',
      '.s-image'
    ];
    
    for (const selector of selectors) {
      const imgElement = element.querySelector(selector);
      if (imgElement) {
        return imgElement.src || imgElement.getAttribute('data-src');
      }
    }
    return null;
  }

  extractProductUrl(element) {
    const selectors = [
      'a[href*="/dp/"]',
      '.a-link-normal[href*="/dp/"]'
    ];
    
    for (const selector of selectors) {
      const linkElement = element.querySelector(selector);
      if (linkElement) {
        return linkElement.href;
      }
    }
    return window.location.href;
  }

  extractAvailability(element) {
    const selectors = [
      '#availability span',
      '.a-size-medium.a-color-success',
      '.a-size-medium.a-color-price',
      '.a-size-medium.a-color-state'
    ];
    
    for (const selector of selectors) {
      const availabilityElement = element.querySelector(selector);
      if (availabilityElement) {
        return availabilityElement.textContent.trim();
      }
    }
    return 'Unknown';
  }

  extractSeller(element) {
    const sellerData = {
      name: null,
      rating: null,
      feedbackCount: null,
      contactInfo: null,
      socialLinks: [],
      businessInfo: null
    };

    // Extract seller name
    const nameSelectors = [
      '#merchant-info',
      '.a-size-small.a-color-secondary',
      '[data-automation-id="seller-name"]',
      '#sellerProfileTriggerId',
      '.a-link-normal[href*="/stores/"]',
      '.a-size-small.a-color-base'
    ];
    
    for (const selector of nameSelectors) {
      const sellerElement = element.querySelector(selector);
      if (sellerElement) {
        sellerData.name = sellerElement.textContent.trim();
        break;
      }
    }

    // Extract seller rating and feedback
    const ratingSelectors = [
      '.a-icon-alt[aria-label*="stars"]',
      '.a-size-small.a-color-base[href*="/feedback/"]',
      '.seller-rating'
    ];

    for (const selector of ratingSelectors) {
      const ratingElement = element.querySelector(selector);
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
        const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*stars?/i);
        if (ratingMatch) {
          sellerData.rating = parseFloat(ratingMatch[1]);
        }
        
        const feedbackMatch = ratingText.match(/(\d+)/);
        if (feedbackMatch) {
          sellerData.feedbackCount = parseInt(feedbackMatch[1]);
        }
      }
    }

    // Extract seller profile link
    const profileLink = element.querySelector('a[href*="/stores/"], a[href*="/seller/"], a[href*="/feedback/"]');
    if (profileLink) {
      sellerData.profileUrl = profileLink.href;
    }

    // Try to extract additional seller information from seller page
    this.extractSellerDetails(sellerData);

    return sellerData;
  }

  async extractSellerDetails(sellerData) {
    if (!sellerData.profileUrl) return;

    try {
      // This would require additional API calls to seller pages
      // For now, we'll extract what's available on the current page
      
      // Look for seller contact information
      const contactSelectors = [
        '[data-automation-id="seller-contact"]',
        '.seller-contact-info',
        '.merchant-contact'
      ];

      for (const selector of contactSelectors) {
        const contactElement = document.querySelector(selector);
        if (contactElement) {
          sellerData.contactInfo = contactElement.textContent.trim();
          break;
        }
      }

      // Look for social media links
      const socialLinks = document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"]');
      socialLinks.forEach(link => {
        sellerData.socialLinks.push({
          platform: this.getSocialPlatform(link.href),
          url: link.href
        });
      });

    } catch (error) {
      console.log('Could not extract additional seller details:', error);
    }
  }

  getSocialPlatform(url) {
    if (url.includes('facebook')) return 'Facebook';
    if (url.includes('twitter')) return 'Twitter';
    if (url.includes('instagram')) return 'Instagram';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('youtube')) return 'YouTube';
    return 'Other';
  }

  extractCategory(element) {
    const breadcrumbElement = element.querySelector('#wayfinding-breadcrumbs_feature_div');
    if (breadcrumbElement) {
      const links = breadcrumbElement.querySelectorAll('a');
      return Array.from(links).map(link => link.textContent.trim()).join(' > ');
    }
    return null;
  }

  getProductElements() {
    // For search results page
    if (window.location.href.includes('/s?')) {
      return document.querySelectorAll('[data-component-type="s-search-result"]');
    }
    
    // For product page
    if (window.location.href.includes('/dp/')) {
      return [document];
    }
    
    // For category pages
    return document.querySelectorAll('[data-asin]');
  }

  async trackProduct(productData) {
    if (!productData || !productData.asin) return;
    
    const trackedProduct = {
      ...productData,
      trackedAt: new Date().toISOString(),
      priceHistory: [{
        price: productData.price,
        date: new Date().toISOString()
      }]
    };
    
    this.trackedProducts.add(productData.asin);
    
    // Save to storage
    const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
    trackedProducts[productData.asin] = trackedProduct;
    await chrome.storage.local.set({ trackedProducts });
    
    this.updateStatus(`Product ${productData.asin} tracked`);
    return trackedProduct;
  }

  async trackCurrentProduct() {
    const productData = this.extractCurrentProduct();
    if (productData) {
      return this.trackProduct(productData);
    }
  }

  async extractSellerInformation() {
    this.updateStatus('Extracting seller information...', 'loading');
    
    try {
      const sellers = [];
      const productElements = this.getProductElements();
      
      for (const element of productElements) {
        const sellerData = this.extractSeller(element);
        if (sellerData && sellerData.name) {
          sellers.push(sellerData);
        }
      }
      
      // Remove duplicates based on seller name
      const uniqueSellers = sellers.filter((seller, index, self) => 
        index === self.findIndex(s => s.name === seller.name)
      );
      
      this.updateStatus(`Extracted ${uniqueSellers.length} unique sellers`, 'success');
      
      // Store seller data
      this.sellerData = uniqueSellers;
      
      // Send to popup
      try {
        chrome.runtime.sendMessage({
          action: 'sellerDataExtracted',
          data: uniqueSellers
        });
      } catch (error) {
        console.warn('Could not send seller data to popup:', error);
        localStorage.setItem('amazon-seller-data', JSON.stringify(uniqueSellers));
      }
      
      return uniqueSellers;
    } catch (error) {
      console.error('Error extracting seller information:', error);
      this.updateStatus('Error extracting seller information', 'error');
    }
  }

  async getTrackedProducts() {
    const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
    return Object.values(trackedProducts);
  }

  async loadTrackedProducts() {
    const { trackedProducts = {} } = await chrome.storage.local.get(['trackedProducts']);
    this.trackedProducts = new Set(Object.keys(trackedProducts));
  }

  async sortProducts(sortBy) {
    const productElements = this.getProductElements();
    const products = [];
    
    // Extract data for sorting
    for (const element of productElements) {
      const data = this.extractProductData(element);
      if (data) {
        products.push({ element, data });
      }
    }
    
    // Sort products
    products.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.data.price || 0) - (b.data.price || 0);
        case 'price-high':
          return (b.data.price || 0) - (a.data.price || 0);
        case 'rating':
          return (b.data.rating || 0) - (a.data.rating || 0);
        case 'reviews':
          return (b.data.reviewCount || 0) - (a.data.reviewCount || 0);
        case 'title':
          return (a.data.title || '').localeCompare(b.data.title || '');
        default:
          return 0;
      }
    });
    
    // Reorder DOM elements
    const container = productElements[0]?.parentElement;
    if (container) {
      products.forEach(({ element }) => {
        container.appendChild(element);
      });
    }
    
    this.updateStatus(`Products sorted by ${sortBy}`);
  }

  async filterProducts(filter) {
    const productElements = this.getProductElements();
    
    productElements.forEach(element => {
      const data = this.extractProductData(element);
      let show = true;
      
      if (filter.minPrice && data.price && data.price < parseFloat(filter.minPrice)) {
        show = false;
      }
      
      if (filter.maxPrice && data.price && data.price > parseFloat(filter.maxPrice)) {
        show = false;
      }
      
      if (filter.minRating && data.rating && data.rating < parseFloat(filter.minRating)) {
        show = false;
      }
      
      element.style.display = show ? 'block' : 'none';
    });
    
    this.updateStatus('Products filtered');
  }

  async automateAction(actionType) {
    switch (actionType) {
      case 'addToCart':
        this.clickElement('#add-to-cart-button');
        break;
      case 'addToWishlist':
        this.clickElement('#add-to-wishlist-button-submit');
        break;
      case 'buyNow':
        this.clickElement('#buy-now-button');
        break;
      case 'nextPage':
        this.clickElement('.a-pagination .a-last');
        break;
      case 'previousPage':
        this.clickElement('.a-pagination .a-first');
        break;
    }
    
    this.updateStatus(`Action ${actionType} executed`);
  }

  clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
    }
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Page content changed, update UI if needed
          this.updateTrackedProductsDisplay();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  updateTrackedProductsDisplay() {
    const productElements = this.getProductElements();
    productElements.forEach(element => {
      const asin = this.extractASIN(element);
      if (asin && this.trackedProducts.has(asin)) {
        element.classList.add('tracked-product');
      }
    });
  }

  updateStatus(message) {
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  }

  togglePanel() {
    const panel = document.getElementById('amazon-extractor-panel');
    const controls = panel.querySelector('.extractor-controls');
    const toggleBtn = document.getElementById('toggle-panel');
    
    if (controls.style.display === 'none') {
      controls.style.display = 'block';
      toggleBtn.textContent = '';
    } else {
      controls.style.display = 'none';
      toggleBtn.textContent = '+';
    }
  }
}

// Initialize the extractor when the page loads
console.log('Amazon Data Extractor - Content script loaded');

function initializeExtractor() {
  try {
    console.log('Initializing AmazonDataExtractor...');
    const extractor = new AmazonDataExtractor();
    window.amazonExtractor = extractor;
    console.log('AmazonDataExtractor initialized successfully');
  } catch (error) {
    console.error('Error initializing AmazonDataExtractor:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtractor);
} else {
  initializeExtractor();
}
