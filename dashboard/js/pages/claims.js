/**
 * Claims Management Page
 */

class ClaimsPage {
  constructor() {
    this.claims = [];
    this.filteredClaims = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
  }

  async render(container) {
    try {
      const result = await api.getClaims();
      this.claims = result.claims;
      this.filteredClaims = this.claims;

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">All Claims (${this.claims.length})</h3>
            <button class="btn btn-primary" onclick="app.loadPage('add-claim')">
              ➕ Add New Claim
            </button>
          </div>

          <div class="card-body">
            <!-- Filters -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
              <input
                type="text"
                class="form-control"
                style="flex: 1; min-width: 200px;"
                placeholder="Search claims..."
                id="claimSearchInput"
              />

              <select class="form-control" style="width: 200px;" id="categoryFilter">
                <option value="all">All Categories</option>
                ${CONFIG.CATEGORIES.map(cat => `
                  <option value="${cat}">${cat}</option>
                `).join('')}
              </select>

              <button class="btn btn-secondary" onclick="claimsPage.exportClaims()">
                📥 Export
              </button>
            </div>

            <!-- Claims Table -->
            <div class="table-container" id="claimsTable">
              ${this.renderTable()}
            </div>
          </div>
        </div>
      `;

      // Setup event listeners
      this.setupFilters();

      // Make instance available globally
      window.claimsPage = this;
    } catch (error) {
      console.error('Error loading claims:', error);
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Failed to Load Claims</div>
            <div class="empty-state-text">${error.message}</div>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }

  renderTable() {
    if (this.filteredClaims.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No Claims Found</div>
          <div class="empty-state-text">Try adjusting your filters or add a new claim.</div>
        </div>
      `;
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Confidence</th>
            <th>Evidence</th>
            <th>Patterns</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredClaims.map(claim => `
            <tr>
              <td>
                <strong>${utils.truncate(claim.title, 50)}</strong>
                <br>
                <small style="color: var(--gray)">${utils.truncate(claim.description, 80)}</small>
              </td>
              <td>
                <span class="badge" style="background: ${utils.getCategoryColor(claim.category)}">
                  ${claim.category}
                </span>
              </td>
              <td>
                <span class="badge ${utils.getConfidenceBadge(claim.confidence)}">
                  ${(claim.confidence * 100).toFixed(0)}%
                </span>
              </td>
              <td>${(claim.evidenceScore * 100).toFixed(0)}%</td>
              <td>${claim.patterns.length}</td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="viewClaim('${claim.id}')">View</button>
                <button class="btn btn-sm btn-danger" onclick="claimsPage.deleteClaim('${claim.id}')">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  setupFilters() {
    const searchInput = document.getElementById('claimSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput?.addEventListener('input', utils.debounce((e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    }, 300));

    categoryFilter?.addEventListener('change', (e) => {
      this.currentCategory = e.target.value;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredClaims = this.claims.filter(claim => {
      const matchesSearch = !this.searchQuery ||
        claim.title.toLowerCase().includes(this.searchQuery) ||
        claim.description.toLowerCase().includes(this.searchQuery);

      const matchesCategory = this.currentCategory === 'all' ||
        claim.category === this.currentCategory;

      return matchesSearch && matchesCategory;
    });

    const tableContainer = document.getElementById('claimsTable');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderTable();
    }
  }

  async deleteClaim(claimId) {
    const confirmed = await utils.confirm(
      'Are you sure you want to delete this claim? This action cannot be undone.',
      'Delete Claim'
    );

    if (confirmed) {
      try {
        utils.showLoading();
        await api.deleteClaim(claimId);
        utils.hideLoading();

        utils.showToast('Claim deleted successfully', 'success');

        // Refresh claims list
        const result = await api.getClaims();
        this.claims = result.claims;
        this.applyFilters();
      } catch (error) {
        utils.hideLoading();
        utils.showToast('Failed to delete claim: ' + error.message, 'error');
      }
    }
  }

  exportClaims() {
    utils.downloadJSON(this.filteredClaims, 'claims-export.json');
    utils.showToast('Claims exported successfully', 'success');
  }
}
