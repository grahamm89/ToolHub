// analytics.js - simple privacy-friendly event logger
// Set your webhook URL here (leave blank to disable sending)
const ANALYTICS_WEBHOOK = ''; // e.g., 'https://your-webhook-url'

function logEvent(event, payload = {}) {
  if (!ANALYTICS_WEBHOOK) return;
  const data = {
    event,
    payload,
    ua: navigator.userAgent,
    ts: new Date().toISOString()
  };
  fetch(ANALYTICS_WEBHOOK, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  }).catch(()=>{});
}

// Example usage across app.js: logEvent('page_view'), logEvent('install_prompt_shown')
