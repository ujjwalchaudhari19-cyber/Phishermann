// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanUrl") {
    handleUrlScan(request.url, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleUrlScan(url, sendResponse) {
  try {
    const { firebaseToken } = await chrome.storage.local.get("firebaseToken");
    
    if (!firebaseToken) {
      sendResponse({ status: "error", message: "Please login via dashboard" });
      return;
    }

    const response = await fetch("http://localhost:8000/scan/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firebaseToken}`
      },
      body: JSON.stringify({ url: url })
    });

    const data = await response.json();
    sendResponse({ status: "success", data: data });
  } catch (error) {
    console.error("Scan error:", error);
    sendResponse({ status: "error", message: "Backend unreachable" });
  }
}
