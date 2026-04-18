// Content script for Phishermann
(async () => {
  const currentUrl = window.location.href;

  // Don't scan localhost or common internal pages
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) return;

  chrome.runtime.sendMessage({ action: "scanUrl", url: currentUrl }, (response) => {
    if (response && response.status === "success") {
      const data = response.data;
      if (data.verdict === "phishing" || data.verdict === "suspicious") {
        showWarningOverlay(data);
      }
    }
  });
})();

function showWarningOverlay(data) {
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
  document.head.appendChild(style);

  // Blur the document body
  document.body.style.filter = "blur(20px)";

  const overlay = document.createElement("div");
  overlay.id = "phishermann-overlay";
  overlay.innerHTML = `
    <h1>⚠️ Phishing Site Detected</h1>
    <div class="score-badge">Confidence Score: ${data.confidence_score}%</div>
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
