/**
 * Main Application Logic
 */

class App {
  constructor() {
    this.currentPage = 'home';
    this.pages = {
      home: HomePage,
      claims: ClaimsPage,
      analytics: AnalyticsPage,
      'add-claim': AddClaimPage,
      settings: SettingsPage
    };

    this.init();
  }

  init() {
    // Setup event listeners
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupGlobalSearch();

    // Load initial page
    this.loadPage('home');
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;

        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Load page
        this.loadPage(page);
      });
    });
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
          }
        }
      });
    }
  }

  setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');

    if (searchInput) {
      searchInput.addEventListener('keyup', utils.debounce(async (e) => {
        const query = e.target.value.trim();

        if (query.length >= 2) {
          try {
            const result = await api.getClaims({ search: query });
            console.log('Search results:', result);
            // Could show search results in a dropdown
          } catch (error) {
            console.error('Search error:', error);
          }
        }
      }, 500));
    }
  }

  async loadPage(pageName) {
    this.currentPage = pageName;

    // Update page title
    const titles = {
      home: 'Dashboard',
      claims: 'Claims Management',
      analytics: 'Analytics',
      'add-claim': 'Add New Claim',
      settings: 'Settings'
    };

    document.getElementById('pageTitle').textContent = titles[pageName] || pageName;

    // Load page content
    const pageContent = document.getElementById('pageContent');

    try {
      const PageClass = this.pages[pageName];

      if (PageClass) {
        const page = new PageClass();
        await page.render(pageContent);
      } else {
        pageContent.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <div class="empty-state-icon">🚧</div>
              <div class="empty-state-title">Page Under Construction</div>
              <div class="empty-state-text">This page is coming soon!</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading page:', error);
      pageContent.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Error Loading Page</div>
            <div class="empty-state-text">${error.message}</div>
          </div>
        </div>
      `;
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
