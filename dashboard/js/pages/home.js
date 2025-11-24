/**
 * Home/Dashboard Page
 */

class HomePage {
  async render(container) {
    try {
      // Fetch statistics
      const stats = await api.getClaimStats();
      const detections = await api.getDetectionAnalytics();

      container.innerHTML = `
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon primary">📝</div>
            <div class="stat-details">
              <div class="stat-label">Total Claims</div>
              <div class="stat-value">${stats.stats.totalClaims}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon success">✓</div>
            <div class="stat-details">
              <div class="stat-label">Total Detections</div>
              <div class="stat-value">${utils.formatNumber(stats.stats.totalDetections)}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon warning">📊</div>
            <div class="stat-details">
              <div class="stat-label">Avg Evidence Score</div>
              <div class="stat-value">${(stats.stats.avgEvidenceScore * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon info">📅</div>
            <div class="stat-details">
              <div class="stat-label">Today's Detections</div>
              <div class="stat-value">${detections.analytics.today}</div>
              <div class="stat-change positive">+${utils.calculatePercentage(detections.analytics.today, detections.analytics.thisWeek)}% this week</div>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Claims by Category</h3>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Claims Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.stats.categoryCounts.map(cat => `
                    <tr>
                      <td>
                        <span class="badge" style="background: ${utils.getCategoryColor(cat.category)}">
                          ${cat.category}
                        </span>
                      </td>
                      <td>${cat.count}</td>
                      <td>${utils.calculatePercentage(cat.count, stats.stats.totalClaims)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Top Detected Claims -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Most Detected Claims</h3>
            <button class="btn btn-sm btn-primary" onclick="app.loadPage('claims')">View All</button>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Detections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${detections.analytics.topClaims.slice(0, 5).map(claim => `
                    <tr>
                      <td>${utils.truncate(claim.title, 60)}</td>
                      <td><span class="badge badge-info">${claim.detection_count}</span></td>
                      <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewClaim('${claim.id}')">View</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Failed to Load Dashboard</div>
            <div class="empty-state-text">Please ensure the backend API is running.</div>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }
}

window.viewClaim = async function(claimId) {
  try {
    const result = await api.getClaim(claimId);
    const claim = result.claim;

    const content = `
      <div>
        <h4>${claim.title}</h4>
        <p>${claim.description}</p>
        <p><strong>Confidence:</strong> ${(claim.confidence * 100).toFixed(0)}%</p>
        <p><strong>Evidence Score:</strong> ${(claim.evidenceScore * 100).toFixed(0)}%</p>
        <p><strong>Reasons For:</strong> ${claim.reasonsFor}</p>
        <p><strong>Reasons Against:</strong> ${claim.reasonsAgainst}</p>
        <p><strong>Category:</strong> <span class="badge" style="background: ${utils.getCategoryColor(claim.category)}">${claim.category}</span></p>
        <p><strong>URL:</strong> <a href="${claim.url}" target="_blank">${claim.url}</a></p>
        <p><strong>Patterns:</strong></p>
        <ul>
          ${claim.patterns.map(p => `<li><code>${p}</code></li>`).join('')}
        </ul>
      </div>
    `;

    utils.createModal('Claim Details', content, [
      { text: 'Close', type: 'secondary', onclick: "this.closest('.modal-overlay').remove()" }
    ]);
  } catch (error) {
    utils.showToast('Failed to load claim details', 'error');
  }
};
