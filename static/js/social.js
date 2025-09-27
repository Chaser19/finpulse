// static/js/social.js
async function fetchJSON(url) {
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

function renderTweets(listEl, tweets) {
  listEl.innerHTML = '';
  if (!Array.isArray(tweets) || tweets.length === 0) {
    const li = document.createElement('li');
    li.className = 'list-group-item py-2';
    li.textContent = 'No tweets available.';
    listEl.appendChild(li);
    return;
  }
  tweets.forEach(tw => {
    const li = document.createElement('li');
    li.className = 'list-group-item py-2';
    const date = tw && tw.date ? new Date(tw.date) : null;
    const dateStr = date ? date.toLocaleString() : '';
    const url = (tw && tw.url) || '#';
    const text = (tw && tw.text) || '';
    li.innerHTML = `
      <div class="small text-muted">${dateStr}</div>
      <div class="mt-1">${escapeHtml(text)}</div>
      <div class="mt-1"><a href="${url}" target="_blank" rel="noopener">View on X</a></div>
    `;
    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function initMyTweets() {
  const hosts = [
    document.getElementById('my-tweets'),
    document.getElementById('my-tweets-page'),
  ].filter(Boolean);
  if (hosts.length === 0) return;

  for (const host of hosts) {
    const user = (host.dataset && host.dataset.user) || '';
    if (!user) continue;
    const data = await fetchJSON(`/api/social/tweets?user=${encodeURIComponent(user)}&limit=5`);
    if (data && !data.error) {
      renderTweets(host, data);
    } else {
      // Show error hint
      host.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'list-group-item py-2';
      const hint = data && data.hint ? ` — ${data.hint}` : '';
      li.textContent = `Tweets unavailable${hint}`;
      host.appendChild(li);
    }
  }
}

document.addEventListener('DOMContentLoaded', initMyTweets);

