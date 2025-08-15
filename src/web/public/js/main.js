/**
 * Main JavaScript - Progressive enhancement for School ERP
 * Follows DRY principles with reusable components
 */

// Global app object
window.SchoolERP = {
  // Configuration
  config: {
    debounceDelay: 300,
    autoSaveInterval: 30000,
    notificationDuration: 5000
  },

  // Utilities
  utils: {
    // Debounce function for search inputs
    debounce(func, wait) {
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

    // Format currency
    formatCurrency(amount, currency = 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },

    // Format date
    formatDate(dateString, options = {}) {
      const date = new Date(dateString);
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      };
      return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
    },

    // Show loading state
    showLoading(element) {
      element.disabled = true;
      element.classList.add('opacity-50', 'cursor-not-allowed');
      const originalText = element.textContent;
      element.textContent = 'Processing...';
      element.dataset.originalText = originalText;
    },

    // Hide loading state
    hideLoading(element) {
      element.disabled = false;
      element.classList.remove('opacity-50', 'cursor-not-allowed');
      element.textContent = element.dataset.originalText || element.textContent;
      delete element.dataset.originalText;
    },

    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
      
      const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
      };

      notification.className += ` ${colors[type] || colors.info} border`;
      notification.innerHTML = `
        <div class="flex items-start">
          <div class="flex-1">${message}</div>
          <button type="button" class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      `;

      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);

      // Auto remove
      if (duration > 0) {
        setTimeout(() => {
          notification.classList.add('translate-x-full');
          setTimeout(() => notification.remove(), 300);
        }, duration);
      }

      return notification;
    }
  },

  // Form handling
  forms: {
    // Initialize form enhancements
    init() {
      this.setupFormValidation();
      this.setupFileUploads();
      this.setupAutoSave();
      this.setupDoubleSubmitPrevention();
    },

    // Setup client-side validation
    setupFormValidation() {
      document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', (e) => {
          if (!this.validateForm(form)) {
            e.preventDefault();
          }
        });

        // Real-time validation
        form.querySelectorAll('input, select, textarea').forEach(field => {
          field.addEventListener('blur', () => {
            this.validateField(field);
          });
        });
      });
    },

    // Validate individual field
    validateField(field) {
      const errors = [];
      const value = field.value.trim();

      // Required field validation
      if (field.hasAttribute('required') && !value) {
        errors.push(`${this.getFieldLabel(field)} is required`);
      }

      // Email validation
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Please enter a valid email address');
      }

      // Phone validation (Indian format)
      if (field.type === 'tel' && value && !/^(\+91|91)?[\s-]?\d{10}$/.test(value)) {
        errors.push('Please enter a valid phone number');
      }

      // Custom pattern validation
      if (field.pattern && value && !new RegExp(field.pattern).test(value)) {
        errors.push(field.dataset.patternMessage || 'Invalid format');
      }

      this.showFieldErrors(field, errors);
      return errors.length === 0;
    },

    // Validate entire form
    validateForm(form) {
      let isValid = true;
      const fields = form.querySelectorAll('input, select, textarea');
      
      fields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    },

    // Show field-level errors
    showFieldErrors(field, errors) {
      // Remove existing error display
      const existingError = field.parentNode.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }

      // Update field styling
      if (errors.length > 0) {
        field.classList.remove('form-input');
        field.classList.add('form-error');
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-sm text-red-600 mt-1';
        errorDiv.textContent = errors[0];
        field.parentNode.appendChild(errorDiv);
      } else {
        field.classList.remove('form-error');
        field.classList.add('form-input');
      }
    },

    // Get field label for error messages
    getFieldLabel(field) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      return label ? label.textContent.replace('*', '').trim() : field.name || 'Field';
    },

    // Setup file upload enhancements
    setupFileUploads() {
      document.querySelectorAll('input[type="file"]').forEach(input => {
        const container = input.closest('.file-upload-container');
        if (!container) return;

        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          container.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
          container.addEventListener(eventName, () => {
            container.classList.add('border-tenant-primary', 'bg-tenant-primary', 'bg-opacity-10');
          });
        });

        ['dragleave', 'drop'].forEach(eventName => {
          container.addEventListener(eventName, () => {
            container.classList.remove('border-tenant-primary', 'bg-tenant-primary', 'bg-opacity-10');
          });
        });

        container.addEventListener('drop', (e) => {
          const files = e.dataTransfer.files;
          if (files.length) {
            input.files = files;
            this.handleFileSelect(input, files);
          }
        });

        // File selection handler
        input.addEventListener('change', (e) => {
          this.handleFileSelect(input, e.target.files);
        });
      });
    },

    // Handle file selection
    handleFileSelect(input, files) {
      const container = input.closest('.file-upload-container');
      const preview = container?.querySelector('.file-preview');
      
      if (!preview) return;

      Array.from(files).forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item flex items-center justify-between p-2 bg-gray-50 rounded border mb-2';
        
        item.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
            </svg>
            <div>
              <div class="text-sm font-medium">${file.name}</div>
              <div class="text-xs text-gray-500">${this.formatFileSize(file.size)}</div>
            </div>
          </div>
          <button type="button" class="text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        `;

        preview.appendChild(item);
      });
    },

    // Format file size
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Setup auto-save for forms
    setupAutoSave() {
      document.querySelectorAll('form[data-auto-save]').forEach(form => {
        const saveInterval = setInterval(() => {
          if (form.dataset.changed === 'true') {
            this.autoSave(form);
          }
        }, SchoolERP.config.autoSaveInterval);

        // Track form changes
        form.addEventListener('input', () => {
          form.dataset.changed = 'true';
        });

        // Clean up interval when form is removed
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === form) {
                clearInterval(saveInterval);
                observer.disconnect();
              }
            });
          });
        });

        observer.observe(document.body, { childList: true, subtree: true });
      });
    },

    // Auto-save form data
    autoSave(form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      fetch(form.action + '/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(() => {
        form.dataset.changed = 'false';
        // Show subtle indication that data was saved
        const indicator = form.querySelector('.auto-save-indicator');
        if (indicator) {
          indicator.textContent = 'Saved';
          indicator.classList.add('text-green-600');
          setTimeout(() => {
            indicator.textContent = '';
            indicator.classList.remove('text-green-600');
          }, 2000);
        }
      }).catch(() => {
        // Silently fail for auto-save
      });
    },

    // Prevent double submission
    setupDoubleSubmitPrevention() {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
          const submitButton = this.querySelector('button[type="submit"]');
          if (submitButton && !submitButton.disabled) {
            SchoolERP.utils.showLoading(submitButton);
            
            // Re-enable after 5 seconds as a fallback
            setTimeout(() => {
              SchoolERP.utils.hideLoading(submitButton);
            }, 5000);
          }
        });
      });
    }
  },

  // Search functionality
  search: {
    init() {
      document.querySelectorAll('[data-search]').forEach(input => {
        const handler = SchoolERP.utils.debounce((e) => {
          this.performSearch(e.target);
        }, SchoolERP.config.debounceDelay);

        input.addEventListener('input', handler);
      });
    },

    async performSearch(input) {
      const query = input.value.trim();
      const searchType = input.dataset.search;
      const resultsContainer = document.querySelector(input.dataset.results || '[data-search-results]');

      if (!resultsContainer) return;

      if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
      }

      try {
        const response = await fetch(`/api/search/${searchType}?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success) {
          this.displaySearchResults(resultsContainer, data.data, searchType);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    },

    displaySearchResults(container, results, type) {
      if (results.length === 0) {
        container.innerHTML = '<div class="p-3 text-gray-500 text-sm">No results found</div>';
        return;
      }

      const html = results.map(item => {
        switch (type) {
          case 'students':
            return `
              <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onclick="selectStudent(${item.id})">
                <div class="font-medium">${item.name}</div>
                <div class="text-sm text-gray-600">${item.admission_number} • ${item.class_name}</div>
              </div>
            `;
          case 'users':
            return `
              <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onclick="selectUser(${item.id})">
                <div class="font-medium">${item.name}</div>
                <div class="text-sm text-gray-600">${item.email} • ${item.role}</div>
              </div>
            `;
          default:
            return `
              <div class="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                <div class="font-medium">${item.name || item.title}</div>
              </div>
            `;
        }
      }).join('');

      container.innerHTML = html;
    }
  },

  // Mobile navigation
  mobile: {
    init() {
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');
      const menuIcon = document.getElementById('menu-icon');
      const closeIcon = document.getElementById('close-icon');

      if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
          const isOpen = !mobileMenu.classList.contains('hidden');
          
          if (isOpen) {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
          } else {
            mobileMenu.classList.remove('hidden');
            menuIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
          }
        });
      }
    }
  },

  // Initialize all components
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.forms.init();
      this.search.init();
      this.mobile.init();

      // Initialize tooltips
      this.initTooltips();

      // Initialize modals
      this.initModals();

      console.log('School ERP frontend initialized');
    });
  },

  // Initialize tooltips
  initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg -mt-8';
        tooltip.textContent = e.target.dataset.tooltip;
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        
        e.target.style.position = 'relative';
        e.target.appendChild(tooltip);
      });

      element.addEventListener('mouseleave', (e) => {
        const tooltip = e.target.querySelector('div');
        if (tooltip) {
          tooltip.remove();
        }
      });
    });
  },

  // Initialize modals
  initModals() {
    document.querySelectorAll('[data-modal-target]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = button.dataset.modalTarget;
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = button.closest('.modal');
        if (modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      });
    });
  }
};

// Initialize the app
SchoolERP.init();