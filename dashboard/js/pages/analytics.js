/**
 * Analytics Page
 */

class AnalyticsPage {
  async render(container) {
    try {
      const [detections, trends, categories] = await Promise.all([
        api.getDetectionAnalytics(),
        api.getTrends(),
        api.getCategoryAnalytics()
      ]);

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Detection Analytics</h3>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon success">📊</div>
                <div class="stat-details">
                  <div class="stat-label">Total Detections</div>
                  <div class="stat-value">${utils.formatNumber(detections.analytics.total)}</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon info">📅</div>
                <div class="stat-details">
                  <div class="stat-label">Today</div>
                  <div class="stat-value">${detections.analytics.today}</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon primary">📈</div>
                <div class="stat-details">
                  <div class="stat-label">This Week</div>
                  <div class="stat-value">${detections.analytics.thisWeek}</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon warning">📆</div>
                <div class="stat-details">
                  <div class="stat-label">This Month</div>
                  <div class="stat-value">${detections.analytics.thisMonth}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Category Performance</h3>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Claims</th>
                    <th>Detections</th>
                    <th>Avg Evidence Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${categories.categories.map(cat => `
                    <tr>
                      <td>
                        <span class="badge" style="background: ${utils.getCategoryColor(cat.category)}">
                          ${cat.category}
                        </span>
                      </td>
                      <td>${cat.claim_count}</td>
                      <td>${cat.detection_count || 0}</td>
                      <td>${(cat.avg_evidence_score * 100).toFixed(0)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Top Detected Claims</h3>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Detections</th>
                  </tr>
                </thead>
                <tbody>
                  ${detections.analytics.topClaims.map(claim => `
                    <tr>
                      <td>${claim.title}</td>
                      <td><span class="badge badge-info">${claim.detection_count}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading analytics:', error);
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Failed to Load Analytics</div>
            <div class="empty-state-text">${error.message}</div>
          </div>
        </div>
      `;
    }
  }
}
