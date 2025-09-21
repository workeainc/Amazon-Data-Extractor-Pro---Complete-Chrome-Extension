// Amazon Data Extractor Pro - Popup Diagnostic Script
// Simple diagnostic to identify popup issues

console.log('🔍 Amazon Data Extractor Pro - Popup Diagnostic');

// Check if we're in extension context
console.log('Extension context:', typeof chrome !== 'undefined');

// Check Chrome APIs
if (typeof chrome !== 'undefined') {
  console.log('Chrome APIs available:');
  console.log('- chrome.runtime:', !!chrome.runtime);
  console.log('- chrome.tabs:', !!chrome.tabs);
  console.log('- chrome.storage:', !!chrome.storage);
  console.log('- chrome.notifications:', !!chrome.notifications);
}

// Check DOM elements
console.log('DOM Elements check:');
const elements = [
  'popup-container',
  'popup-header', 
  'popup-main',
  'extract-all-btn',
  'extract-current-btn',
  'track-product-btn',
  'data-container',
  'status-text',
  'status-icon'
];

elements.forEach(id => {
  const element = document.getElementById(id) || document.querySelector(`.${id}`);
  console.log(`- ${id}:`, !!element);
});

// Check if PopupController is defined
console.log('PopupController defined:', typeof PopupController !== 'undefined');

// Check if popupController instance exists
console.log('popupController instance:', typeof popupController !== 'undefined');

// Test basic functionality
try {
  console.log('Testing localStorage...');
  localStorage.setItem('test', 'value');
  const test = localStorage.getItem('test');
  localStorage.removeItem('test');
  console.log('localStorage test:', test === 'value' ? 'PASS' : 'FAIL');
} catch (error) {
  console.log('localStorage test: FAIL -', error.message);
}

// Check CSS loading
const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
console.log('Stylesheets loaded:', stylesheets.length);

// Check for any JavaScript errors
window.addEventListener('error', (event) => {
  console.error('JavaScript Error:', event.error);
});

console.log('🔍 Diagnostic complete');
