// script.js — shared utility
// Menu and Cashier pages now have self-contained inline scripts.
// This file is kept for the admin page.

// escapeHtml utility (used globally)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
