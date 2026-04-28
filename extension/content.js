// Content script for Phishermann
// Sync token from dashboard
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.type === "PHISHERMANN_AUTH") {
    chrome.storage.local.set({ firebaseToken: event.data.token, userEmail: event.data.email });
  } else if (event.data.type === "PHISHERMANN_AUTH_LOGOUT") {
    chrome.storage.local.remove(["firebaseToken", "userEmail"]);
  }
});

const scanCache = new Map();
const TRUSTED_DOMAINS = ['google.com', 'youtube.com', 'github.com', 'microsoft.com', 'apple.com', 'amazon.com'];
let isNavigating = false;

document.addEventListener('click', async (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.href;
  if (!href || href === "#" || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === window.location.href) return;
  
  try {
    const urlObj = new URL(href);
    const domain = urlObj.hostname.replace('www.', '');
    if (TRUSTED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) return;
  } catch(err) { return; }

  e.preventDefault();
  if (isNavigating) return;
  isNavigating = true;

  // Show loading indicator
  const loader = document.createElement('div');
  loader.id = 'phishermann-link-loader';
  loader.textContent = '🔍 Checking link...';
  Object.assign(loader.style, {
    position: 'fixed',
    left: `${e.clientX + 15}px`,
    top: `${e.clientY + 15}px`,
    background: '#111',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  });
  document.body.appendChild(loader);

  const target = link.target;
  const removeLoader = () => { if (loader.parentNode) loader.remove(); };
  const navigate = () => {
    isNavigating = false;
    removeLoader();
    if (target === "_blank") window.open(href, "_blank");
    else window.location.href = href;
  };

  const cached = scanCache.get(href);
  if (cached && Date.now() - cached.timestamp < 60000) {
    if (cached.verdict === "phishing" || cached.verdict === "suspicious" || cached.verdict === "scam") {
      isNavigating = false;
      removeLoader();
      showWarningOverlay(cached.data, window.location.hostname);
    } else {
      navigate();
    }
    return;
  }

  let finished = false;
  const timeoutId = setTimeout(() => {
    if (finished) return;
    finished = true;
    navigate();
  }, 3000);

  chrome.runtime.sendMessage({ type: "SCAN_URL", url: href }, (response) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeoutId);
    
    if (chrome.runtime.lastError || !response || response.status !== "success") {
      navigate();
      return;
    }

    scanCache.set(href, { verdict: response.data.verdict, data: response.data, timestamp: Date.now() });

    if (response.data.verdict === "phishing" || response.data.verdict === "suspicious" || response.data.verdict === "scam") {
      isNavigating = false;
      removeLoader();
      showWarningOverlay(response.data, window.location.hostname);
    } else {
      navigate();
    }
  });
}, true);

(async () => {
  const currentUrl = window.location.href;

  // Don't scan localhost or common internal pages
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) return;

  chrome.runtime.sendMessage({ action: "scanUrl", url: currentUrl }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response && response.status === "error" && response.message === "Please login via dashboard") {
      console.warn("Phishermann: Extension is not logged in. Please login via the dashboard for real-time protection.");
      return;
    }
    if (response && response.status === "success") {
      const data = response.data;
      if (data.verdict === "phishing" || data.verdict === "suspicious" || data.verdict === "scam") {
        showWarningOverlay(data);
      }
    }
  });
})();

function showWarningOverlay(data, dynamicHost = null) {
  // Inject CSS
  const style = document.createElement("style");
  style.textContent = `
    #phishermann-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      z-index: 2147483647;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: white; font-family: 'Inter', sans-serif;
      text-align: center;
      padding: 20px;
    }
    #phishermann-overlay h1 { color: #ff4444; font-size: 3rem; margin-bottom: 20px; }
    #phishermann-overlay p { font-size: 1.2rem; margin-bottom: 30px; max-width: 600px; }
    .phisher-btn {
      padding: 15px 30px; font-size: 1rem; cursor: pointer; border: none; border-radius: 8px; margin: 10px;
      font-weight: bold; transition: 0.2s;
    }
    .btn-back { background: #00ff88; color: #001a00; }
    .btn-back:hover { background: #00dd77; transform: scale(1.05); }
    .btn-proceed { background: transparent; color: #ff4444; border: 1px solid #ff4444; }
    .btn-proceed:hover { background: rgba(255, 68, 68, 0.1); }
    .score-badge {
      background: rgba(255, 68, 68, 0.2);
      border: 1px solid #ff4444;
      padding: 5px 15px;
      border-radius: 20px;
      color: #ff4444;
      font-weight: bold;
      margin-bottom: 20px;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.documentElement.appendChild(style);
  }

  // Blur the document body if it exists
  if (document.body) {
    document.body.style.filter = "blur(20px)";
  }

  const overlay = document.createElement("div");
  overlay.id = "phishermann-overlay";
  overlay.innerHTML = `
    <h1>⚠️ Phishing Site Detected</h1>
    ${dynamicHost ? `<p style="color:#ffaa00; font-weight:bold; margin-bottom:10px;">⚠️ This link was found inside ${dynamicHost}</p>` : ''}
    <div class="score-badge">Threat Probability: ${data.confidence_score}%</div>
    <p><b>Blocked URL:</b> ${data.url}</p>
    <p>Phishermann has blocked this site because it appears to be a phishing or scam page. Proceeding may compromise your accounts and personal data.</p>
    <div>
      <button class="phisher-btn btn-back" id="phisher-back">Go Back Safely</button>
      <button class="phisher-btn btn-proceed" id="phisher-proceed">I Understand, Proceed anyway</button>
    </div>
  `;
  document.documentElement.appendChild(overlay);

  document.getElementById("phisher-back").addEventListener("click", () => {
    window.history.back();
  });

  document.getElementById("phisher-proceed").addEventListener("click", () => {
    document.body.style.filter = "none";
    document.getElementById("phishermann-overlay").remove();
  });
}
