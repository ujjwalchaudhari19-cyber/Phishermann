// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanUrl") {
    handleUrlScan(request.url, sendResponse, 15000);
    return true; // Keep channel open for async response
  }
  if (request.type === "SCAN_URL") {
    handleUrlScan(request.url, sendResponse, 10000);
    return true; 
  }
});

// Handle navigations that fail to load (e.g., DNS errors on fake domains)
chrome.webNavigation.onErrorOccurred.addListener((details) => {
  if (details.frameId === 0) { // Only check main frame
    const url = details.url;
    if (url.startsWith("http")) {
      // Create a dummy sendResponse to capture the backend result
      const sendResponse = (response) => {
        if (response && response.status === "success") {
          const data = response.data;
          if (data.verdict === "phishing" || data.verdict === "suspicious" || data.verdict === "scam") {
            chrome.tabs.update(details.tabId, {
              url: chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(url)}&score=${data.confidence_score}`)
            });
          }
        }
      };
      handleUrlScan(url, sendResponse, 10000);
    }
  }
});

async function handleUrlScan(url, sendResponse, timeoutMs = 15000) {
  try {
    const { firebaseToken } = await chrome.storage.local.get("firebaseToken");
    
    if (!firebaseToken) {
      sendResponse({ status: "error", message: "Please login via dashboard" });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch("https://phishermann.onrender.com/scan/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firebaseToken}`
      },
      body: JSON.stringify({ url: url }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        sendResponse({ status: "error", message: "Session expired, please login again" });
      } else {
        sendResponse({ status: "error", message: `API Error: ${response.status}` });
      }
      return;
    }

    const data = await response.json();
    sendResponse({ status: "success", data: data });
  } catch (error) {
    console.error("Scan error:", error);
    sendResponse({ status: "error", message: "Backend unreachable" });
  }
}
