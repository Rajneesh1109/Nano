chrome.alarms.create("syncLogs", { periodInMinutes: 0.5 });

function logPrefix() {
  return "[Smart Time Tracker][bg]";
}

function normalizeUserId(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidToken(value) {
  const t = normalizeToken(value);
  return t.length >= 20;
}

function isValidUserId(value) {
  const id = normalizeUserId(value);
  return id.length >= 6;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.type === "SET_USER_ID") {
    const incoming = normalizeUserId(request.user_id);

    if (!isValidUserId(incoming)) {
      sendResponse({ success: false, error: "Invalid user_id" });
      return false;
    }

    chrome.storage.local.get(["user_id"], (result) => {
      chrome.storage.local.set({ user_id: incoming }, () => {
        console.log(logPrefix(), "User ID updated:", incoming);
        sendResponse({ success: true });
      });
    });
    return true;
  }
  return false;
});

async function getActiveSession() {
  const data = await chrome.storage.local.get(["activeSession"]);
  return data.activeSession || null;
}

async function setActiveSession(session) {
  if (session) {
    await chrome.storage.local.set({ activeSession: session });
  } else {
    await chrome.storage.local.remove(["activeSession"]);
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo && changeInfo.url) {
    handleTabChange(tabId);
  }
});

chrome.idle.onStateChanged.addListener((newState) => {
  if (newState !== "active") {
    closeCurrentSession();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) handleTabChange(tabs[0].id);
    });
  }
});

async function handleTabChange(newTabId) {
  await closeCurrentSession();

  try {
    const tab = await chrome.tabs.get(newTabId);
    if (!tab || !tab.url) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) return;

    const domain = new URL(tab.url).hostname;

    const session = {
      domain,
      startTime: Date.now()
    };
    await setActiveSession(session);

    console.log(logPrefix(), "Started tracking:", domain);
  } catch (e) {
    console.error(logPrefix(), "Error accessing tab:", e);
  }
}

async function closeCurrentSession() {
  const session = await getActiveSession();
  if (!session) return;

  const { domain, startTime } = session;
  if (!domain || !startTime) return;

  const duration = (Date.now() - startTime) / 1000;
  if (duration < 1) return;

  const log = {
    domain,
    startTime: new Date(startTime).toISOString(),
    duration,
  };

  try {
    const data = await chrome.storage.local.get(["logs"]);
    const logs = data && Array.isArray(data.logs) ? data.logs : [];
    logs.push(log);
    await chrome.storage.local.set({ logs });

    await setActiveSession(null);

    chrome.alarms.create("syncLogs", { when: Date.now() + 100 });

    console.log(logPrefix(), "Logged:", log);
  } catch (e) {
    console.error(logPrefix(), "Failed to store log locally:", e);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm || alarm.name !== "syncLogs") return;

  chrome.storage.local.get(
    ["logs", "extension_token", "user_id"],
    async (result) => {
      const logs = result && Array.isArray(result.logs) ? result.logs : [];
      const extension_token = normalizeToken(result && result.extension_token);
      const user_id = normalizeUserId(result && result.user_id);

      if (logs.length === 0) return;

      if (!isValidToken(extension_token)) {
        if (!isValidUserId(user_id)) {
          console.warn(
            logPrefix(),
            "No valid extension_token yet (and no valid legacy user_id); skipping sync and keeping logs locally.",
          );
          return;
        }

        console.warn(
          logPrefix(),
          "No valid extension_token yet; falling back to legacy user_id upload.",
        );
      }

      try {
        const headers = { "Content-Type": "application/json" };

        const useToken = isValidToken(extension_token);

        if (useToken) {
          headers.Authorization = `Bearer ${extension_token}`;
        }

        const body = { logs, user_id: useToken ? undefined : user_id };
        if (user_id && !body.user_id) body.user_id = user_id;

        console.log(
          logPrefix(),
          "Preparing to sync. Payload:",
          JSON.stringify(body),
        );

        const response = await fetch("https://nono-ral1.onrender.com/api/logs", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          console.log(
            logPrefix(),
            "Synced logs to server. Status:",
            response.status,
          );
          chrome.storage.local.set({ logs: [] });
        } else {
          const text = await response.text().catch(() => "");
          console.warn(
            logPrefix(),
            "Server responded non-OK; keeping logs to retry. Status:",
            response.status,
            {
              body: text,
            },
          );
        }
      } catch (error) {
        console.error(
          logPrefix(),
          "Failed to sync. Server likely down or blocking.",
          error,
        );
      }
    },
  );
});
