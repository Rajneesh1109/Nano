/**
 * Smart Time Tracker - Content Script
 *
 * Listens for auth events from the web dashboard and forwards the `user_id`
 * to the extension background service worker, which stores it in
 * `chrome.storage.local`.
 *
 * Web app should dispatch:
 * window.dispatchEvent(new CustomEvent('SMART_TIME_TRACKER_AUTH', { detail: { user_id: '<uuid>' } }))
 */

(() => {
  const LOG_PREFIX = "[Smart Time Tracker][content]";

  const log = (...args) => {
    // eslint-disable-next-line no-console
    console.log(LOG_PREFIX, ...args);
  };

  const warn = (...args) => {
    // eslint-disable-next-line no-console
    console.warn(LOG_PREFIX, ...args);
  };

  const normalizeUserId = (value) =>
    typeof value === "string" ? value.trim() : "";

  // Keep validation loose (Supabase user IDs are UUIDs, but don’t hard-require UUID format)
  const isValidUserId = (userId) => normalizeUserId(userId).length >= 6;

  const sendUserIdToExtension = (userId) =>
    new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { type: "SET_USER_ID", user_id: userId },
          (response) => {
            const err = chrome.runtime.lastError;
            if (err) {
              warn("Failed to send message to background:", err.message);
              resolve({ ok: false, error: err.message });
              return;
            }

            if (response && response.success) {
              resolve({ ok: true, response });
            } else {
              resolve({
                ok: false,
                error: "No success response from background.",
                response,
              });
            }
          },
        );
      } catch (e) {
        warn("Unexpected exception while messaging background:", e);
        resolve({ ok: false, error: String((e && e.message) || e) });
      }
    });

  // Avoid writing repeatedly if the page emits the event multiple times.
  let lastSavedUserId = null;

  const handleAuthEvent = async (event) => {
    const detail = (event && event.detail) || {};
    const userId = normalizeUserId(detail.user_id);

    if (!isValidUserId(userId)) {
      warn("Received SMART_TIME_TRACKER_AUTH without a valid user_id:", detail);
      return;
    }

    if (userId === lastSavedUserId) {
      log("Received same user_id again; ignoring duplicate:", userId);
      return;
    }

    log("Received user_id from web app:", userId);

    const result = await sendUserIdToExtension(userId);

    if (result.ok) {
      lastSavedUserId = userId;
      log("User ID saved to extension successfully.");
    } else {
      warn("Could not save user_id to extension:", result.error);
    }
  };

  // Mark the page as having the extension installed (Robust detection)
  document.documentElement.setAttribute('data-smart-tracker-installed', 'true');

  // Check for attribute-based auth (Backup for missed events)
  function checkDomForUserId() {
    const userId = document.body.getAttribute('data-smart-tracker-user-id');
    if (userId) {
      chrome.runtime.sendMessage({
        type: 'SET_USER_ID',
        user_id: userId
      });
    }
  }

  // Observe body for attributes
  const observer = new MutationObserver(() => {
    checkDomForUserId();
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-smart-tracker-user-id'] });

  // Check immediately
  checkDomForUserId();

  window.addEventListener("SMART_TIME_TRACKER_AUTH", handleAuthEvent);

  log(
    "loaded and listening for SMART_TIME_TRACKER_AUTH on window and data-smart-tracker-user-id on body.",
  );
})();
