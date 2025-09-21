// Amazon Data Extractor Pro - Injected Script
// Advanced DOM manipulation and automation for Amazon pages

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.amazonExtractorInjected) {
    return;
  }
  window.amazonExtractorInjected = true;

  class AmazonInjectedExtractor {
    constructor() {
      this.isActive = false;
      this.automationQueue = [];
      this.observers = new Map();
      this.init();
    }

    init() {
      this.setupMessageListener();
      this.setupKeyboardShortcuts();
      this.observePageChanges();
      this.createGlobalAPI();
    }

    setupMessageListener() {
      // Listen for messages from content script
      window.addEventListener('amazonExtractorMessage', (event) => {
        this.handleMessage(event.detail);
      });
    }

    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (event) => {
        // Ctrl+Shift+E: Extract all products
        if (event.ctrlKey && event.shiftKey && event.key === 'E') {
          event.preventDefault();
          this.extractAllProducts();
        }
        
        // Ctrl+Shift+T: Track current product
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
          event.preventDefault();
          this.trackCurrentProduct();
        }
        
        // Ctrl+Shift+S: Sort products
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
          event.preventDefault();
          this.showSortOptions();
        }
      });
    }

    observePageChanges() {
      // Observe product containers for dynamic content
      const productSelectors = [
        '[data-component-type="s-search-result"]',
        '[data-asin]',
        '.s-result-item',
        '.s-search-result'
      ];

      productSelectors.forEach(selector => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              this.handleProductChanges(mutation);
            }
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        this.observers.set(selector, observer);
      });
    }

    handleProductChanges(mutation) {
      const addedNodes = Array.from(mutation.addedNodes);
      const removedNodes = Array.from(mutation.removedNodes);
      
      // Check if new products were added
      const newProducts = addedNodes.filter(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        this.isProductElement(node)
      );

      if (newProducts.length > 0) {
        this.highlightNewProducts(newProducts);
      }
    }

    isProductElement(element) {
      return element.matches && (
        element.matches('[data-component-type="s-search-result"]') ||
        element.matches('[data-asin]') ||
        element.matches('.s-result-item')
      );
    }

    highlightNewProducts(products) {
      products.forEach((product, index) => {
        setTimeout(() => {
          product.classList.add('extractor-new-product');
          setTimeout(() => {
            product.classList.remove('extractor-new-product');
          }, 2000);
        }, index * 100);
      });
    }

    createGlobalAPI() {
      // Expose API to content script
      window.amazonExtractor = {
        extractCurrentProduct: () => this.extractCurrentProduct(),
        extractAllProducts: () => this.extractAllProducts(),
        trackCurrentProduct: () => this.trackCurrentProduct(),
        sortProducts: (criteria) => this.sortProducts(criteria),
        filterProducts: (filters) => this.filterProducts(filters),
        automateAction: (action) => this.automateAction(action),
        highlightProducts: (asins) => this.highlightProducts(asins),
        scrollToProduct: (asin) => this.scrollToProduct(asin)
      };
    }

    handleMessage(message) {
      switch (message.action) {
        case 'extractAll':
          this.extractAllProducts();
          break;
        case 'extractCurrent':
          this.extractCurrentProduct();
          break;
        case 'trackProduct':
          this.trackCurrentProduct();
          break;
        case 'sortProducts':
          this.sortProducts(message.criteria);
          break;
        case 'filterProducts':
          this.filterProducts(message.filters);
          break;
        case 'automateAction':
          this.automateAction(message.actionType);
          break;
        case 'highlightProducts':
          this.highlightProducts(message.asins);
          break;
      }
    }

    extractCurrentProduct() {
      const productData = {
        title: this.extractTitle(document),
        price: this.extractPrice(document),
        asin: this.extractASIN(document),
        rating: this.extractRating(document),
        reviewCount: this.extractReviewCount(document),
        imageUrl: this.extractImageUrl(document),
        productUrl: window.location.href,
        availability: this.extractAvailability(document),
        seller: this.extractSeller(document),
        category: this.extractCategory(document),
        extractedAt: new Date().toISOString()
      };

      this.showToast('Product extracted successfully', 'success');
      return productData;
    }

    extractAllProducts() {
      const products = [];
      const productElements = this.getProductElements();
      
      this.showToast(`Extracting ${productElements.length} products...`, 'info');
      
      productElements.forEach((element, index) => {
        const productData = this.extractProductData(element);
        if (productData) {
          products.push(productData);
        }
        
        // Visual feedback
        element.classList.add('extracting-product');
        setTimeout(() => {
          element.classList.remove('extracting-product');
          element.classList.add('extracted-product');
        }, 100);
      });

      this.showToast(`Extracted ${products.length} products`, 'success');
      return products;
    }

    extractProductData(element) {
      return {
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
        extractedAt: new Date().toISOString()
      };
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
      const selectors = [
        '#merchant-info',
        '.a-size-small.a-color-secondary',
        '[data-automation-id="seller-name"]'
      ];
      
      for (const selector of selectors) {
        const sellerElement = element.querySelector(selector);
        if (sellerElement) {
          return sellerElement.textContent.trim();
        }
      }
      return null;
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

    trackCurrentProduct() {
      const productData = this.extractCurrentProduct();
      if (productData && productData.asin) {
        this.highlightProductByASIN(productData.asin);
        this.showToast(`Tracking product: ${productData.title}`, 'success');
        return productData;
      }
      return null;
    }

    sortProducts(criteria) {
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
        switch (criteria) {
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
      
      // Reorder DOM elements with animation
      const container = productElements[0]?.parentElement;
      if (container) {
        products.forEach(({ element }, index) => {
          setTimeout(() => {
            element.style.transition = 'transform 0.3s ease';
            element.style.transform = 'translateY(0)';
            container.appendChild(element);
          }, index * 50);
        });
      }
      
      this.showToast(`Products sorted by ${criteria}`, 'success');
    }

    filterProducts(filters) {
      const productElements = this.getProductElements();
      let visibleCount = 0;
      
      productElements.forEach(element => {
        const data = this.extractProductData(element);
        let show = true;
        
        if (filters.minPrice && data.price && data.price < parseFloat(filters.minPrice)) {
          show = false;
        }
        
        if (filters.maxPrice && data.price && data.price > parseFloat(filters.maxPrice)) {
          show = false;
        }
        
        if (filters.minRating && data.rating && data.rating < parseFloat(filters.minRating)) {
          show = false;
        }
        
        element.style.transition = 'opacity 0.3s ease';
        element.style.display = show ? 'block' : 'none';
        
        if (show) visibleCount++;
      });
      
      this.showToast(`Showing ${visibleCount} products`, 'info');
    }

    automateAction(actionType) {
      const actions = {
        'addToCart': () => this.clickElement('#add-to-cart-button'),
        'addToWishlist': () => this.clickElement('#add-to-wishlist-button-submit'),
        'buyNow': () => this.clickElement('#buy-now-button'),
        'nextPage': () => this.clickElement('.a-pagination .a-last'),
        'previousPage': () => this.clickElement('.a-pagination .a-first'),
        'addToCartAll': () => this.addToCartAllVisible(),
        'scrollToTop': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        'scrollToBottom': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      };

      if (actions[actionType]) {
        actions[actionType]();
        this.showToast(`Action ${actionType} executed`, 'success');
      }
    }

    clickElement(selector) {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          element.click();
        }, 500);
      }
    }

    addToCartAllVisible() {
      const addToCartButtons = document.querySelectorAll('#add-to-cart-button');
      addToCartButtons.forEach((button, index) => {
        setTimeout(() => {
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            button.click();
          }, 500);
        }, index * 1000);
      });
    }

    highlightProducts(asins) {
      const productElements = this.getProductElements();
      productElements.forEach(element => {
        const asin = this.extractASIN(element);
        if (asin && asins.includes(asin)) {
          element.classList.add('extractor-highlighted');
          setTimeout(() => {
            element.classList.remove('extractor-highlighted');
          }, 3000);
        }
      });
    }

    highlightProductByASIN(asin) {
      const productElements = this.getProductElements();
      productElements.forEach(element => {
        const elementASIN = this.extractASIN(element);
        if (elementASIN === asin) {
          element.classList.add('extractor-tracked');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    scrollToProduct(asin) {
      const productElements = this.getProductElements();
      for (const element of productElements) {
        const elementASIN = this.extractASIN(element);
        if (elementASIN === asin) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('extractor-scrolled-to');
          setTimeout(() => {
            element.classList.remove('extractor-scrolled-to');
          }, 2000);
          break;
        }
      }
    }

    showSortOptions() {
      const options = ['price-low', 'price-high', 'rating', 'reviews', 'title'];
      const selectedOption = prompt('Sort by:\n1. Price: Low to High\n2. Price: High to Low\n3. Rating\n4. Reviews\n5. Title\n\nEnter number (1-5):');
      
      if (selectedOption && selectedOption >= 1 && selectedOption <= 5) {
        const criteria = options[selectedOption - 1];
        this.sortProducts(criteria);
      }
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `extractor-toast ${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }

    // Cleanup method
    destroy() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
      window.amazonExtractorInjected = false;
    }
  }

  // Initialize the injected extractor
  const extractor = new AmazonInjectedExtractor();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    extractor.destroy();
  });

})();
