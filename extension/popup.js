// Popup script for Phishermann
document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("status");
  const authActions = document.getElementById("auth-actions");
  const loginMsg = document.getElementById("login-msg");
  const scanBtn = document.getElementById("scan-btn");
  const urlInput = document.getElementById("url-input");
  const resultBox = document.getElementById("result-box");
  const logoutBtn = document.getElementById("logout-btn");
  const loader = document.getElementById("loader");

  // Check login status
  const { firebaseToken, userEmail } = await chrome.storage.local.get(["firebaseToken", "userEmail"]);

  if (firebaseToken) {
    statusEl.textContent = `Logged in as: ${userEmail}`;
    authActions.style.display = "block";
    
    // Auto-fetch current tab URL and trigger scan
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        urlInput.value = currentUrl;
        
        if (!currentUrl.startsWith("chrome://") && !currentUrl.startsWith("edge://")) {
          scanBtn.click();
        }
      }
    });
  } else {
    statusEl.textContent = "Not logged in";
    loginMsg.style.display = "block";
  }

  scanBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) return;

    loader.style.display = "block";
    resultBox.classList.remove("visible");

    chrome.runtime.sendMessage({ action: "scanUrl", url: url }, (response) => {
      loader.style.display = "none";
      if (response && response.status === "success") {
        displayResult(response.data);
      } else {
        alert(response.message || "Error scanning URL");
      }
    });
  });

  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["firebaseToken", "userEmail"], () => {
      window.close();
    });
  });

  const openDashboardBtn = document.getElementById("open-dashboard-btn");
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://phishermann.onrender.com/login" });
    });
  }

  function displayResult(data) {
    const verdictEl = document.getElementById("verdict");
    const scoreEl = document.getElementById("score");

    verdictEl.textContent = data.verdict.toUpperCase();
    scoreEl.textContent = `Threat Probability: ${data.confidence_score}%`;

    resultBox.className = "result visible";
    if (data.verdict === "phishing" || data.verdict === "scam") {
      resultBox.classList.add("danger");
    } else if (data.verdict === "suspicious") {
      resultBox.classList.add("warning");
    } else {
      resultBox.classList.add("safe");
    }
  }
});
