/**
 * Add/Edit Claim Page
 */

class AddClaimPage {
  constructor() {
    this.patterns = [''];
  }

  async render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Add New Claim</h3>
        </div>

        <div class="card-body">
          <form id="claimForm">
            <div class="form-group">
              <label class="form-label">ID *</label>
              <input type="text" class="form-control" id="claimId" required placeholder="e.g., my-claim-id">
              <small style="color: var(--gray)">Unique identifier (lowercase, hyphens only)</small>
            </div>

            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-control" id="claimTitle" required placeholder="e.g., Vaccines cause autism">
            </div>

            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea class="form-control" id="claimDescription" required placeholder="Detailed explanation of the claim and its evidence..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Analysis URL *</label>
              <input type="url" class="form-control" id="claimUrl" required placeholder="https://ideastockexchange.com/w/page/my-claim">
            </div>

            <div class="form-group">
              <label class="form-label">Category *</label>
              <select class="form-control" id="claimCategory" required>
                <option value="">Select category...</option>
                ${CONFIG.CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Detection Patterns *</label>
              <div id="patternsContainer">
                ${this.renderPatterns()}
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="addClaimPage.addPattern()">
                + Add Pattern
              </button>
              <small style="color: var(--gray); display: block; margin-top: 5px;">
                Use regex patterns to detect this claim in text
              </small>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label class="form-label">Confidence (0-1) *</label>
                <input type="number" class="form-control" id="claimConfidence" required min="0" max="1" step="0.01" value="0.80">
              </div>

              <div class="form-group">
                <label class="form-label">Reasons For</label>
                <input type="number" class="form-control" id="claimReasonsFor" min="0" value="0">
              </div>

              <div class="form-group">
                <label class="form-label">Reasons Against</label>
                <input type="number" class="form-control" id="claimReasonsAgainst" min="0" value="0">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Evidence Score (0-1) *</label>
              <input type="number" class="form-control" id="claimEvidenceScore" required min="0" max="1" step="0.01" value="0.75">
            </div>

            <div style="display: flex; gap: 10px; margin-top: 30px;">
              <button type="submit" class="btn btn-primary">Create Claim</button>
              <button type="button" class="btn btn-secondary" onclick="app.loadPage('claims')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('claimForm').addEventListener('submit', (e) => this.handleSubmit(e));
    window.addClaimPage = this;
  }

  renderPatterns() {
    return this.patterns.map((pattern, index) => `
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <input
          type="text"
          class="form-control"
          placeholder="e.g., vaccines? cause autism"
          value="${pattern}"
          onchange="addClaimPage.updatePattern(${index}, this.value)"
        >
        ${this.patterns.length > 1 ? `
          <button type="button" class="btn btn-sm btn-danger" onclick="addClaimPage.removePattern(${index})">×</button>
        ` : ''}
      </div>
    `).join('');
  }

  addPattern() {
    this.patterns.push('');
    document.getElementById('patternsContainer').innerHTML = this.renderPatterns();
  }

  removePattern(index) {
    this.patterns.splice(index, 1);
    document.getElementById('patternsContainer').innerHTML = this.renderPatterns();
  }

  updatePattern(index, value) {
    this.patterns[index] = value;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const claimData = {
      id: document.getElementById('claimId').value.trim(),
      title: document.getElementById('claimTitle').value.trim(),
      description: document.getElementById('claimDescription').value.trim(),
      url: document.getElementById('claimUrl').value.trim(),
      category: document.getElementById('claimCategory').value,
      patterns: this.patterns.filter(p => p.trim().length > 0),
      confidence: parseFloat(document.getElementById('claimConfidence').value),
      reasonsFor: parseInt(document.getElementById('claimReasonsFor').value) || 0,
      reasonsAgainst: parseInt(document.getElementById('claimReasonsAgainst').value) || 0,
      evidenceScore: parseFloat(document.getElementById('claimEvidenceScore').value)
    };

    // Validation
    if (claimData.patterns.length === 0) {
      utils.showToast('At least one pattern is required', 'error');
      return;
    }

    try {
      utils.showLoading();
      await api.createClaim(claimData);
      utils.hideLoading();

      utils.showToast('Claim created successfully!', 'success');
      app.loadPage('claims');
    } catch (error) {
      utils.hideLoading();
      utils.showToast('Failed to create claim: ' + error.message, 'error');
    }
  }
}
