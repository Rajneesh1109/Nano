/**
 * Smart Time Tracker - Extension Popup
 */

const API_BASE = "https://nono-ral1.onrender.com";
const DASHBOARD_URL = "https://nono-web.vercel.app/";

const elTime = document.getElementById("time");

const elSetupView = document.getElementById("setup-view");
const elConnectedView = document.getElementById("connected-view");
const elConnectedUserId = document.getElementById("connectedUserId");
const elDashboardBtnConnected = document.getElementById("dashboardBtnConnected");

const elDashboardBtn = document.getElementById("dashboardBtn");
const elPairingStatus = document.getElementById("pairingStatus");
const elClearAuthBtn = document.getElementById("clearAuthBtn");

function safeSetText(node, text) {
  if (!node) return;
  node.textContent = String(text ?? "");
}

function formatUserId(id) {
  if (!id) return "";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function setPairingStatus(text, kind = "info") {
  if (!elPairingStatus) return;
  safeSetText(elPairingStatus, text);
  if (kind === "ok") elPairingStatus.style.color = "#0a7a2f";
  else if (kind === "error") elPairingStatus.style.color = "#b00020";
  else elPairingStatus.style.color = "#666";
}

// Fetch stats for the mini dashboard
async function renderStats(userId) {
  const elStatsList = document.getElementById("statsList");
  if (!elStatsList || !userId) return;

  try {
    // Fetch logs from server (last 24h implicitly via simple endpoint, or unfiltered)
    // Ideally the server should support ?limit= or ?date=, but we'll client-side process for now
    const res = await fetch(`${API_BASE}/api/logs?user_id=${userId}`);
    const logs = await res.json();

    if (!Array.isArray(logs) || logs.length === 0) {
      elStatsList.innerHTML = '<div style="text-align:center; color:#666; font-size:11px;">No activity today.</div>';
      return;
    }

    // Process data (Simple aggregations)
    const groups = {};
    let total = 0;
    logs.forEach(l => {
      if (!groups[l.domain]) groups[l.domain] = 0;
      groups[l.domain] += l.duration;
      total += l.duration;
    });

    const sorted = Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3

    // Render
    let html = '';
    sorted.forEach(([domain, duration]) => {
      const pct = Math.min(100, Math.round((duration / total) * 100));
      const timeStr = duration > 3600
        ? `${Math.floor(duration / 3600)}h`
        : `${Math.round(duration / 60)}m`;

      html += `
                <div style="margin-bottom: 8px;">
                    <div class="stat-row">
                        <span style="font-weight:bold;">${domain}</span>
                        <span>${timeStr} (${pct}%)</span>
                    </div>
                    <div class="stat-bar" style="width: ${pct}%;"></div>
                </div>
            `;
    });

    elStatsList.innerHTML = html;

  } catch (e) {
    console.error("Failed to load stats", e);
    elStatsList.innerHTML = '<div style="color:red; font-size:10px;">Failed to load stats.</div>';
  }
}

function renderFromStorage() {
  chrome.storage.local.get(["extension_token", "user_id"], (result) => {
    const token = result && typeof result.extension_token === "string" ? result.extension_token : "";
    const userId = result && typeof result.user_id === "string" ? result.user_id : "";

    // If either token Or user_id is present, consider it "Connected"
    const isConnected = !!token || userId.length > 5;

    if (isConnected) {
      // Show Connected View
      if (elSetupView) elSetupView.style.display = "none";
      if (elConnectedView) elConnectedView.style.display = "block";

      if (elConnectedUserId) {
        // Check if it's a UUID or just a token placeholder
        const displayId = userId && userId.length > 10 ? `${userId.slice(0, 8)}...` : "Active";
        elConnectedUserId.textContent = displayId;
      }

      // Load stats if we have a user ID (Token-only auth might not allow reading stats easily without a /me endpoint, 
      // but for now we assume we have user_id if we have token, or we use legacy ID)
      if (userId) {
        renderStats(userId);
      }
    } else {
      // Show Setup View
      if (elSetupView) elSetupView.style.display = "block";
      if (elConnectedView) elConnectedView.style.display = "none";
    }
  });
}


function clearAuth() {
  chrome.storage.local.remove(["extension_token", "user_id"], () => {
    setPairingStatus("Signed out.", "info");
    renderFromStorage();
    // Open web app with logout param to prevent auto-relogin loop
    chrome.tabs.create({ url: DASHBOARD_URL + "dashboard?logout=true" });
  });
}

function wireEvents() {
  if (elDashboardBtnConnected) {
    elDashboardBtnConnected.addEventListener("click", () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }

  if (elClearAuthBtn) {
    elClearAuthBtn.addEventListener("click", clearAuth);
  }
}

function startClock() {
  if (!elTime) return;
  const tick = () => {
    const now = new Date();
    safeSetText(
      elTime,
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  };
  tick();
  setInterval(tick, 1000);
}

// Init
wireEvents();
renderFromStorage();
startClock();
