/**
 * Utility Functions
 */

const utils = {
  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  /**
   * Show loading overlay
   */
  showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  },

  /**
   * Format date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Calculate percentage
   */
  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  },

  /**
   * Truncate text
   */
  truncate(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  /**
   * Debounce function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Get category color
   */
  getCategoryColor(category) {
    const colors = {
      health: '#28a745',
      science: '#007bff',
      technology: '#17a2b8',
      psychology: '#6f42c1',
      nutrition: '#fd7e14',
      economics: '#ffc107',
      environment: '#20c997',
      history: '#e83e8c',
      language: '#6c757d',
      nature: '#28a745',
      conspiracy: '#dc3545'
    };
    return colors[category] || '#6c757d';
  },

  /**
   * Create modal
   */
  createModal(title, content, buttons = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const buttonsHTML = buttons.map(btn =>
      `<button class="btn btn-${btn.type || 'secondary'}" onclick="${btn.onclick}">${btn.text}</button>`
    ).join('');

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${buttons.length > 0 ? `<div class="modal-footer">${buttonsHTML}</div>` : ''}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    return overlay;
  },

  /**
   * Confirm dialog
   */
  confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      const modal = utils.createModal(
        title,
        `<p>${message}</p>`,
        [
          {
            text: 'Cancel',
            type: 'secondary',
            onclick: `this.closest('.modal-overlay').remove(); window.confirmResolve(false);`
          },
          {
            text: 'Confirm',
            type: 'primary',
            onclick: `this.closest('.modal-overlay').remove(); window.confirmResolve(true);`
          }
        ]
      );

      window.confirmResolve = resolve;
    });
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate URL
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate unique ID
   */
  generateId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      utils.showToast('Copied to clipboard', 'success');
    } catch (error) {
      utils.showToast('Failed to copy', 'error');
    }
  },

  /**
   * Download as JSON
   */
  downloadJSON(data, filename = 'data.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  },

  /**
   * Get confidence badge class
   */
  getConfidenceBadge(confidence) {
    if (confidence >= 0.9) return 'badge-success';
    if (confidence >= 0.75) return 'badge-info';
    if (confidence >= 0.6) return 'badge-warning';
    return 'badge-secondary';
  }
};

// Make utils available globally
window.utils = utils;
