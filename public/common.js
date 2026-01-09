// Common authentication and utility functions

let currentUser = null;

async function initAuth() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      currentUser = await response.json();
      updateUserSection();
    } else {
      // Not logged in, redirect to home
      if (window.location.pathname !== '/' && window.location.pathname !== '/market') {
        window.location.href = '/';
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
  }
}

function updateUserSection() {
  const userSection = document.getElementById('user-section');
  if (!userSection) return;

  if (currentUser) {
    userSection.innerHTML = `
      <div class="user-info">
        <span>${currentUser.username}</span>
        <span class="balance">$${currentUser.balance.toFixed(2)}</span>
        <button class="btn btn-secondary" onclick="handleLogout()" style="padding: 6px 12px; font-size: 14px;">Logout</button>
      </div>
    `;
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function refreshBalance() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      currentUser = await response.json();
      updateUserSection();
    }
  } catch (error) {
    console.error('Error refreshing balance:', error);
  }
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '1000';
  alertDiv.style.minWidth = '300px';

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatPercent(value) {
  return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}
