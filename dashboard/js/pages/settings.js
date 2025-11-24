/**
 * Settings Page
 */

class SettingsPage {
  async render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Settings</h3>
        </div>
        <div class="card-body">
          <div class="empty-state">
            <div class="empty-state-icon">⚙️</div>
            <div class="empty-state-title">Settings</div>
            <div class="empty-state-text">Settings panel coming soon!</div>
          </div>
        </div>
      </div>
    `;
  }
}
